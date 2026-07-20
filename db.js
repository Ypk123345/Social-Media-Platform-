const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'social_db.json');

// Initial state structure
let data = {
  users: [],
  posts: [],
  comments: [],
  likes: [],
  follows: []
};

// Load or save helpers
function loadData() {
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf8');
      data = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to load DB file, using empty schema', err);
    }
  }
}

function saveData() {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

async function initDB() {
  loadData();

  if (data.users.length === 0) {
    console.log('Seeding initial social media data...');
    const now = new Date();
    
    data.users = [
      {
        id: 1,
        username: 'alex_dev',
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'Full-stack developer building cool web apps with Node & React. 🚀',
        created_at: new Date(now - 7 * 86400000).toISOString()
      },
      {
        id: 2,
        username: 'sarah_design',
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        bio: 'Product Designer & UI Enthusiast. Loving dark mode & micro-animations ✨',
        created_at: new Date(now - 5 * 86400000).toISOString()
      },
      {
        id: 3,
        username: 'marcus_tech',
        name: 'Marcus Vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'AI Researcher, coffee enthusiast, and tech blogger. ☕🤖',
        created_at: new Date(now - 3 * 86400000).toISOString()
      }
    ];

    data.posts = [
      {
        id: 1,
        user_id: 1,
        content: 'Just launched our new social media platform! Built with Express and Node.js. What do you think? 🎉',
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        created_at: new Date(now - 2 * 3600000).toISOString()
      },
      {
        id: 2,
        user_id: 2,
        content: 'Crafting a new glassmorphism UI component library today. Micro-interactions make all the difference!',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        created_at: new Date(now - 5 * 3600000).toISOString()
      },
      {
        id: 3,
        user_id: 3,
        content: 'Morning coffee and reading papers on agentic AI workflows. Exciting times ahead!',
        image_url: null,
        created_at: new Date(now - 24 * 3600000).toISOString()
      }
    ];

    data.comments = [
      {
        id: 1,
        post_id: 1,
        user_id: 2,
        content: 'Looks super sleek Alex! The dark aesthetic is spot on. 🔥',
        created_at: new Date(now - 1 * 3600000).toISOString()
      },
      {
        id: 2,
        post_id: 1,
        user_id: 3,
        content: 'Congrats on the launch! Fast performance too.',
        created_at: new Date(now - 30 * 60000).toISOString()
      },
      {
        id: 3,
        post_id: 2,
        user_id: 1,
        content: 'Can not wait to try out the new components!',
        created_at: new Date(now - 4 * 3600000).toISOString()
      }
    ];

    data.likes = [
      { id: 1, post_id: 1, user_id: 2, created_at: new Date().toISOString() },
      { id: 2, post_id: 1, user_id: 3, created_at: new Date().toISOString() },
      { id: 3, post_id: 2, user_id: 1, created_at: new Date().toISOString() },
      { id: 4, post_id: 3, user_id: 1, created_at: new Date().toISOString() },
      { id: 5, post_id: 3, user_id: 2, created_at: new Date().toISOString() }
    ];

    data.follows = [
      { follower_id: 1, following_id: 2, created_at: new Date().toISOString() },
      { follower_id: 1, following_id: 3, created_at: new Date().toISOString() },
      { follower_id: 2, following_id: 1, created_at: new Date().toISOString() }
    ];

    saveData();
    console.log('Database seeded successfully.');
  }
}

// SQL Query parser/emulator for our endpoints
async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function all(sql, params = []) {
  loadData();
  const cleanSql = sql.replace(/\s+/g, ' ').trim();

  // 1. Get all users
  if (cleanSql.includes('FROM users u') && !cleanSql.includes('WHERE u.id =')) {
    const currentUserId = parseInt(params[0]) || 0;
    return data.users.map(u => {
      const followers_count = data.follows.filter(f => f.following_id === u.id).length;
      const following_count = data.follows.filter(f => f.follower_id === u.id).length;
      const is_followed = data.follows.some(f => f.follower_id === currentUserId && f.following_id === u.id) ? 1 : 0;
      return { ...u, followers_count, following_count, is_followed };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // 2. Get user by ID
  if (cleanSql.includes('FROM users u WHERE u.id =') || cleanSql.includes('SELECT * FROM users WHERE id =')) {
    const userId = parseInt(params[params.length - 1]);
    const currentUserId = parseInt(params[0]) || 0;
    const u = data.users.find(usr => usr.id === userId);
    if (!u) return [];

    const followers_count = data.follows.filter(f => f.following_id === u.id).length;
    const following_count = data.follows.filter(f => f.follower_id === u.id).length;
    const is_followed = data.follows.some(f => f.follower_id === currentUserId && f.following_id === u.id) ? 1 : 0;
    return [{ ...u, followers_count, following_count, is_followed }];
  }

  // 3. Follow stats
  if (cleanSql.includes('SELECT (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count')) {
    const targetUserId = parseInt(params[0]);
    const followers_count = data.follows.filter(f => f.following_id === targetUserId).length;
    const following_count = data.follows.filter(f => f.follower_id === targetUserId).length;
    return [{ followers_count, following_count }];
  }

  // 4. Get posts feed
  if (cleanSql.includes('FROM posts p JOIN users u ON p.user_id = u.id')) {
    const currentUserId = parseInt(params[0]) || 0;
    let result = data.posts.map(p => {
      const u = data.users.find(usr => usr.id === p.user_id) || { username: 'deleted', name: 'Deleted User', avatar: '' };
      const likes_count = data.likes.filter(l => l.post_id === p.id).length;
      const comments_count = data.comments.filter(c => c.post_id === p.id).length;
      const is_liked = data.likes.some(l => l.post_id === p.id && l.user_id === currentUserId) ? 1 : 0;
      return {
        id: p.id,
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        user_id: p.user_id,
        username: u.username,
        name: u.name,
        avatar: u.avatar,
        likes_count,
        comments_count,
        is_liked
      };
    });

    if (cleanSql.includes('WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR p.user_id = ?')) {
      const followingIds = data.follows.filter(f => f.follower_id === currentUserId).map(f => f.following_id);
      followingIds.push(currentUserId);
      result = result.filter(p => followingIds.includes(p.user_id));
    } else if (cleanSql.includes('WHERE p.user_id = ?')) {
      const filterUserId = parseInt(params[params.length - 1]);
      result = result.filter(p => p.user_id === filterUserId);
    } else if (cleanSql.includes('WHERE p.id = ?')) {
      const postId = parseInt(params[params.length - 1]);
      result = result.filter(p => p.id === postId);
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // 5. Get comments for a post
  if (cleanSql.includes('FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ?')) {
    const postId = parseInt(params[0]);
    return data.comments
      .filter(c => c.post_id === postId)
      .map(c => {
        const u = data.users.find(usr => usr.id === c.user_id) || { username: 'deleted', name: 'User', avatar: '' };
        return {
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          username: u.username,
          name: u.name,
          avatar: u.avatar
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  // 6. Get single comment by ID
  if (cleanSql.includes('FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?')) {
    const commentId = parseInt(params[0]);
    const c = data.comments.find(cm => cm.id === commentId);
    if (!c) return [];
    const u = data.users.find(usr => usr.id === c.user_id) || { username: 'deleted', name: 'User', avatar: '' };
    return [{
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      username: u.username,
      name: u.name,
      avatar: u.avatar
    }];
  }

  // Count queries
  if (cleanSql.includes('SELECT COUNT(*) as count FROM likes WHERE post_id = ?')) {
    const postId = parseInt(params[0]);
    return [{ count: data.likes.filter(l => l.post_id === postId).length }];
  }

  if (cleanSql.includes('SELECT COUNT(*) as count FROM comments WHERE post_id = ?')) {
    const postId = parseInt(params[0]);
    return [{ count: data.comments.filter(c => c.post_id === postId).length }];
  }

  if (cleanSql.includes('SELECT COUNT(*) as count FROM users')) {
    return [{ count: data.users.length }];
  }

  if (cleanSql.includes('SELECT * FROM posts WHERE id = ?')) {
    const postId = parseInt(params[0]);
    const p = data.posts.find(pst => pst.id === postId);
    return p ? [p] : [];
  }

  if (cleanSql.includes('SELECT * FROM comments WHERE id = ?')) {
    const commentId = parseInt(params[0]);
    const c = data.comments.find(cm => cm.id === commentId);
    return c ? [c] : [];
  }

  return [];
}

async function run(sql, params = []) {
  loadData();
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  let lastID = 0;
  let changes = 0;

  // Insert User
  if (cleanSql.includes('INSERT INTO users')) {
    const existing = data.users.find(u => u.username === params[0]);
    if (existing) {
      throw new Error('UNIQUE constraint failed: users.username');
    }
    lastID = data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
    data.users.push({
      id: lastID,
      username: params[0],
      name: params[1],
      avatar: params[2],
      bio: params[3],
      created_at: new Date().toISOString()
    });
    changes = 1;
  }

  // Update User
  if (cleanSql.includes('UPDATE users SET')) {
    const userId = parseInt(params[3]);
    const u = data.users.find(usr => usr.id === userId);
    if (u) {
      if (params[0] !== null) u.name = params[0];
      if (params[1] !== null) u.avatar = params[1];
      if (params[2] !== null) u.bio = params[2];
      changes = 1;
    }
  }

  // Insert Follow
  if (cleanSql.includes('INSERT OR IGNORE INTO follows')) {
    const follower_id = parseInt(params[0]);
    const following_id = parseInt(params[1]);
    const exists = data.follows.some(f => f.follower_id === follower_id && f.following_id === following_id);
    if (!exists) {
      data.follows.push({ follower_id, following_id, created_at: new Date().toISOString() });
      changes = 1;
    }
  }

  // Delete Follow
  if (cleanSql.includes('DELETE FROM follows')) {
    const follower_id = parseInt(params[0]);
    const following_id = parseInt(params[1]);
    const initLen = data.follows.length;
    data.follows = data.follows.filter(f => !(f.follower_id === follower_id && f.following_id === following_id));
    changes = initLen - data.follows.length;
  }

  // Insert Post
  if (cleanSql.includes('INSERT INTO posts')) {
    lastID = data.posts.length ? Math.max(...data.posts.map(p => p.id)) + 1 : 1;
    data.posts.push({
      id: lastID,
      user_id: parseInt(params[0]),
      content: params[1],
      image_url: params[2] || null,
      created_at: new Date().toISOString()
    });
    changes = 1;
  }

  // Delete Post
  if (cleanSql.includes('DELETE FROM posts WHERE id = ?')) {
    const postId = parseInt(params[0]);
    data.posts = data.posts.filter(p => p.id !== postId);
    data.comments = data.comments.filter(c => c.post_id !== postId);
    data.likes = data.likes.filter(l => l.post_id !== postId);
    changes = 1;
  }

  // Insert Like
  if (cleanSql.includes('INSERT OR IGNORE INTO likes')) {
    const post_id = parseInt(params[0]);
    const user_id = parseInt(params[1]);
    const exists = data.likes.some(l => l.post_id === post_id && l.user_id === user_id);
    if (!exists) {
      lastID = data.likes.length ? Math.max(...data.likes.map(l => l.id)) + 1 : 1;
      data.likes.push({ id: lastID, post_id, user_id, created_at: new Date().toISOString() });
      changes = 1;
    }
  }

  // Delete Like
  if (cleanSql.includes('DELETE FROM likes')) {
    const post_id = parseInt(params[0]);
    const user_id = parseInt(params[1]);
    const initLen = data.likes.length;
    data.likes = data.likes.filter(l => !(l.post_id === post_id && l.user_id === user_id));
    changes = initLen - data.likes.length;
  }

  // Insert Comment
  if (cleanSql.includes('INSERT INTO comments')) {
    lastID = data.comments.length ? Math.max(...data.comments.map(c => c.id)) + 1 : 1;
    data.comments.push({
      id: lastID,
      post_id: parseInt(params[0]),
      user_id: parseInt(params[1]),
      content: params[2],
      created_at: new Date().toISOString()
    });
    changes = 1;
  }

  // Delete Comment
  if (cleanSql.includes('DELETE FROM comments WHERE id = ?')) {
    const commentId = parseInt(params[0]);
    data.comments = data.comments.filter(c => c.id !== commentId);
    changes = 1;
  }

  saveData();
  return { id: lastID, changes };
}

module.exports = {
  initDB,
  get,
  all,
  run
};
