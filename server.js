const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, run, get, all } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database tables & seed data
initDB();

/* ================= USER ROUTES ================= */

// Get all users with follower info relative to current_user_id
app.get('/api/users', async (req, res) => {
  try {
    const currentUserId = req.query.current_user_id || 0;
    const users = await all(`
      SELECT u.id, u.username, u.name, u.avatar, u.bio, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) > 0 as is_followed
      FROM users u
      ORDER BY u.created_at DESC
    `, [currentUserId]);
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.query.current_user_id || 0;

    const user = await get(`
      SELECT u.id, u.username, u.name, u.avatar, u.bio, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) > 0 as is_followed
      FROM users u
      WHERE u.id = ?
    `, [currentUserId, userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user profile
app.post('/api/users', async (req, res) => {
  try {
    const { username, name, avatar, bio } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: 'Username and name are required' });
    }

    const result = await run(`
      INSERT INTO users (username, name, avatar, bio)
      VALUES (?, ?, ?, ?)
    `, [
      username.toLowerCase().replace(/\s+/g, '_'),
      name,
      avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio || 'Hello! I am new on PulseNet.'
    ]);

    const newUser = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    res.status(201).json(newUser);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, avatar, bio } = req.body;

    await run(`
      UPDATE users
      SET name = COALESCE(?, name),
          avatar = COALESCE(?, avatar),
          bio = COALESCE(?, bio)
      WHERE id = ?
    `, [name, avatar, bio, userId]);

    const updatedUser = await get('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= FOLLOW ROUTES ================= */

// Follow a user
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const { follower_id } = req.body;

    if (!follower_id || follower_id === targetUserId) {
      return res.status(400).json({ error: 'Invalid follower action' });
    }

    await run(`
      INSERT OR IGNORE INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `, [follower_id, targetUserId]);

    const stats = await get(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count
    `, [targetUserId, targetUserId]);

    res.json({ success: true, is_followed: true, ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unfollow a user
app.delete('/api/users/:id/follow', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const follower_id = parseInt(req.query.follower_id);

    if (!follower_id) {
      return res.status(400).json({ error: 'Follower ID required' });
    }

    await run(`
      DELETE FROM follows
      WHERE follower_id = ? AND following_id = ?
    `, [follower_id, targetUserId]);

    const stats = await get(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count
    `, [targetUserId, targetUserId]);

    res.json({ success: true, is_followed: false, ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= POST ROUTES ================= */

// Get feed posts (Filter: all, following, or specific user)
app.get('/api/posts', async (req, res) => {
  try {
    const currentUserId = req.query.current_user_id || 0;
    const filter = req.query.feed || 'all'; // 'all', 'following', or 'user'
    const filterUserId = req.query.user_id;

    let sql = `
      SELECT p.id, p.content, p.image_url, p.created_at, p.user_id,
        u.username, u.name, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) > 0 as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;

    const params = [currentUserId];

    if (filter === 'following') {
      sql += ` WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR p.user_id = ?`;
      params.push(currentUserId, currentUserId);
    } else if (filter === 'user' && filterUserId) {
      sql += ` WHERE p.user_id = ?`;
      params.push(filterUserId);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const posts = await all(sql, params);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
app.post('/api/posts', async (req, res) => {
  try {
    const { user_id, content, image_url } = req.body;
    if (!user_id || !content) {
      return res.status(400).json({ error: 'User ID and post content are required' });
    }

    const result = await run(`
      INSERT INTO posts (user_id, content, image_url)
      VALUES (?, ?, ?)
    `, [user_id, content, image_url || null]);

    const post = await get(`
      SELECT p.id, p.content, p.image_url, p.created_at, p.user_id,
        u.username, u.name, u.avatar,
        0 as likes_count, 0 as comments_count, 0 as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.id]);

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    const post = await get('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await run('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, deleted_id: postId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= LIKE ROUTES ================= */

// Like post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    await run(`
      INSERT OR IGNORE INTO likes (post_id, user_id)
      VALUES (?, ?)
    `, [postId, user_id]);

    const likeCount = await get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);
    res.json({ success: true, is_liked: true, likes_count: likeCount.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlike post
app.delete('/api/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const user_id = req.query.user_id;

    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    await run(`
      DELETE FROM likes
      WHERE post_id = ? AND user_id = ?
    `, [postId, user_id]);

    const likeCount = await get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);
    res.json({ success: true, is_liked: false, likes_count: likeCount.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= COMMENT ROUTES ================= */

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await all(`
      SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
        u.username, u.name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment to post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { user_id, content } = req.body;

    if (!user_id || !content) {
      return res.status(400).json({ error: 'User ID and content are required' });
    }

    const result = await run(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `, [postId, user_id, content]);

    const comment = await get(`
      SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
        u.username, u.name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.id]);

    const commentCount = await get('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [postId]);

    res.status(201).json({ ...comment, comments_count: commentCount.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const { user_id } = req.body;

    const comment = await get('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    await run('DELETE FROM comments WHERE id = ?', [commentId]);
    
    const commentCount = await get('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [comment.post_id]);
    res.json({ success: true, post_id: comment.post_id, comments_count: commentCount.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`PulseNet server running at http://localhost:${PORT}`);
});
