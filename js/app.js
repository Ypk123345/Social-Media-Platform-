/**
 * PulseNet Social Platform Frontend Application
 * Supports both Express REST API backend and standalone static GitHub Pages (localStorage DB)
 */

const API_BASE = '/api';
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');

// LocalStorage DB Fallback Engine for GitHub Pages
const LocalDB = {
  KEY: 'pulsenet_local_db',
  get() {
    let data = localStorage.getItem(this.KEY);
    if (!data) {
      const now = new Date();
      data = {
        users: [
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
        ],
        posts: [
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
        ],
        comments: [
          { id: 1, post_id: 1, user_id: 2, content: 'Looks super sleek Alex! The dark aesthetic is spot on. 🔥', created_at: new Date(now - 1 * 3600000).toISOString() },
          { id: 2, post_id: 1, user_id: 3, content: 'Congrats on the launch! Fast performance too.', created_at: new Date(now - 30 * 60000).toISOString() },
          { id: 3, post_id: 2, user_id: 1, content: 'Can not wait to try out the new components!', created_at: new Date(now - 4 * 3600000).toISOString() }
        ],
        likes: [
          { id: 1, post_id: 1, user_id: 2 },
          { id: 2, post_id: 1, user_id: 3 },
          { id: 3, post_id: 2, user_id: 1 },
          { id: 4, post_id: 3, user_id: 1 },
          { id: 5, post_id: 3, user_id: 2 }
        ],
        follows: [
          { follower_id: 1, following_id: 2 },
          { follower_id: 1, following_id: 3 },
          { follower_id: 2, following_id: 1 }
        ]
      };
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } else {
      data = JSON.parse(data);
    }
    return data;
  },
  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }
};

// Application State
const state = {
  activeUserId: 1,
  activeUser: null,
  users: [],
  currentView: 'feed',
  currentFeedTab: 'all',
  viewingProfileId: null,
  posts: [],
  openCommentsPostIds: new Set(),
  useOfflineFallback: IS_GITHUB_PAGES
};

// DOM Elements
const DOM = {
  sidebarNav: document.querySelectorAll('.nav-link'),
  accountSelectorBtn: document.getElementById('account-selector-btn'),
  accountDropdown: document.getElementById('account-dropdown'),
  usersDropdownList: document.getElementById('users-dropdown-list'),
  btnCreateAccount: document.getElementById('btn-create-account'),
  
  activeUserAvatar: document.getElementById('active-user-avatar'),
  activeUserName: document.getElementById('active-user-name'),
  activeUserHandle: document.getElementById('active-user-handle'),
  composerUserAvatar: document.getElementById('composer-user-avatar'),
  
  viewFeed: document.getElementById('view-feed'),
  viewExplore: document.getElementById('view-explore'),
  viewProfile: document.getElementById('view-profile'),
  pageTitle: document.getElementById('page-title'),
  
  feedTabs: document.querySelectorAll('.tab-btn'),
  postContentInput: document.getElementById('post-content-input'),
  btnSubmitPost: document.getElementById('btn-submit-post'),
  btnAddImageUrl: document.getElementById('btn-add-image-url'),
  postImageUrlInput: document.getElementById('post-image-url'),
  imagePreviewContainer: document.getElementById('image-preview-container'),
  imagePreview: document.getElementById('image-preview'),
  btnRemoveImage: document.getElementById('btn-remove-image'),
  postsContainer: document.getElementById('posts-container'),
  
  peopleGrid: document.getElementById('people-grid'),
  
  profileAvatar: document.getElementById('profile-avatar'),
  profileName: document.getElementById('profile-name'),
  profileHandle: document.getElementById('profile-handle'),
  profileBio: document.getElementById('profile-bio'),
  profileDate: document.getElementById('profile-date'),
  profileFollowersCount: document.getElementById('profile-followers-count'),
  profileFollowingCount: document.getElementById('profile-following-count'),
  profilePostsCount: document.getElementById('profile-posts-count'),
  profilePostsUser: document.getElementById('profile-posts-user'),
  profilePostsContainer: document.getElementById('profile-posts-container'),
  btnEditProfile: document.getElementById('btn-edit-profile'),
  btnFollowUser: document.getElementById('btn-follow-user'),
  
  widgetUserAvatar: document.getElementById('widget-user-avatar'),
  widgetUserName: document.getElementById('widget-user-name'),
  widgetUserHandle: document.getElementById('widget-user-handle'),
  widgetFollowers: document.getElementById('widget-followers'),
  widgetFollowing: document.getElementById('widget-following'),
  suggestedUsersList: document.getElementById('suggested-users-list'),
  
  modalEditProfile: document.getElementById('modal-edit-profile'),
  formEditProfile: document.getElementById('form-edit-profile'),
  editName: document.getElementById('edit-name'),
  editAvatar: document.getElementById('edit-avatar'),
  editBio: document.getElementById('edit-bio'),
  closeEditModal: document.getElementById('close-edit-modal'),
  cancelEditModal: document.getElementById('cancel-edit-modal'),
  
  modalNewAccount: document.getElementById('modal-new-account'),
  formNewAccount: document.getElementById('form-new-account'),
  newUsername: document.getElementById('new-username'),
  newName: document.getElementById('new-name'),
  newAvatar: document.getElementById('new-avatar'),
  newBio: document.getElementById('new-bio'),
  closeAccountModal: document.getElementById('close-account-modal'),
  cancelAccountModal: document.getElementById('cancel-account-modal')
};

/* ================= INITIALIZATION ================= */

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadUsers();
  await switchActiveUser(state.activeUserId);
  loadFeed();
});

/* ================= EVENT LISTENERS ================= */

function setupEventListeners() {
  DOM.sidebarNav.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view === 'profile') {
        navigateToProfile(state.activeUserId);
      } else {
        switchView(view);
      }
    });
  });

  DOM.accountSelectorBtn.addEventListener('click', () => {
    DOM.accountDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!DOM.accountSelectorBtn.contains(e.target) && !DOM.accountDropdown.contains(e.target)) {
      DOM.accountDropdown.classList.add('hidden');
    }
  });

  DOM.feedTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.feedTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFeedTab = tab.dataset.feed;
      loadFeed();
    });
  });

  DOM.btnAddImageUrl.addEventListener('click', () => {
    DOM.postImageUrlInput.classList.toggle('hidden');
    if (!DOM.postImageUrlInput.classList.contains('hidden')) {
      DOM.postImageUrlInput.focus();
    }
  });

  DOM.postImageUrlInput.addEventListener('input', () => {
    const url = DOM.postImageUrlInput.value.trim();
    if (url) {
      DOM.imagePreview.src = url;
      DOM.imagePreviewContainer.classList.remove('hidden');
    } else {
      DOM.imagePreviewContainer.classList.add('hidden');
    }
  });

  DOM.btnRemoveImage.addEventListener('click', () => {
    DOM.postImageUrlInput.value = '';
    DOM.imagePreviewContainer.classList.add('hidden');
  });

  DOM.btnSubmitPost.addEventListener('click', handleCreatePost);

  DOM.btnEditProfile.addEventListener('click', () => {
    if (state.activeUser) {
      DOM.editName.value = state.activeUser.name;
      DOM.editAvatar.value = state.activeUser.avatar || '';
      DOM.editBio.value = state.activeUser.bio || '';
      DOM.modalEditProfile.classList.remove('hidden');
    }
  });

  DOM.closeEditModal.addEventListener('click', () => DOM.modalEditProfile.classList.add('hidden'));
  DOM.cancelEditModal.addEventListener('click', () => DOM.modalEditProfile.classList.add('hidden'));
  DOM.formEditProfile.addEventListener('submit', handleUpdateProfile);

  DOM.btnCreateAccount.addEventListener('click', () => {
    DOM.accountDropdown.classList.add('hidden');
    DOM.modalNewAccount.classList.remove('hidden');
  });

  DOM.closeAccountModal.addEventListener('click', () => DOM.modalNewAccount.classList.add('hidden'));
  DOM.cancelAccountModal.addEventListener('click', () => DOM.modalNewAccount.classList.add('hidden'));
  DOM.formNewAccount.addEventListener('submit', handleCreateAccount);

  DOM.btnFollowUser.addEventListener('click', handleProfileFollowToggle);
}

/* ================= NAVIGATION & VIEW MANAGERS ================= */

function switchView(viewName) {
  state.currentView = viewName;

  DOM.sidebarNav.forEach(link => {
    if (link.dataset.view === viewName && viewName !== 'profile') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  DOM.viewFeed.classList.add('hidden');
  DOM.viewExplore.classList.add('hidden');
  DOM.viewProfile.classList.add('hidden');

  if (viewName === 'feed') {
    DOM.viewFeed.classList.remove('hidden');
    DOM.pageTitle.textContent = 'Home Feed';
    loadFeed();
  } else if (viewName === 'explore') {
    DOM.viewExplore.classList.remove('hidden');
    DOM.pageTitle.textContent = 'Explore People';
    loadExplorePeople();
  } else if (viewName === 'profile') {
    DOM.viewProfile.classList.remove('hidden');
    DOM.pageTitle.textContent = 'User Profile';
  }
}

async function navigateToProfile(userId) {
  state.viewingProfileId = userId;
  switchView('profile');
  
  if (parseInt(userId) === parseInt(state.activeUserId)) {
    document.getElementById('my-profile-nav').classList.add('active');
  }

  await loadUserProfileDetails(userId);
}

/* ================= USER MANAGEMENT & API / LOCALDB ================= */

async function loadUsers() {
  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    state.users = db.users.map(u => {
      const followers_count = db.follows.filter(f => f.following_id === u.id).length;
      const following_count = db.follows.filter(f => f.follower_id === u.id).length;
      const is_followed = db.follows.some(f => f.follower_id === state.activeUserId && f.following_id === u.id) ? 1 : 0;
      return { ...u, followers_count, following_count, is_followed };
    });
    renderUsersDropdown();
    renderSuggestedUsers();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users?current_user_id=${state.activeUserId}`);
    if (!res.ok) throw new Error('API unavailable');
    state.users = await res.json();
    renderUsersDropdown();
    renderSuggestedUsers();
  } catch (err) {
    state.useOfflineFallback = true;
    loadUsers();
  }
}

async function switchActiveUser(userId) {
  state.activeUserId = parseInt(userId);
  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const u = db.users.find(usr => usr.id === state.activeUserId);
    const followers_count = db.follows.filter(f => f.following_id === state.activeUserId).length;
    const following_count = db.follows.filter(f => f.follower_id === state.activeUserId).length;
    state.activeUser = { ...u, followers_count, following_count };
    
    updateActiveUserUI();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${userId}?current_user_id=${userId}`);
    if (!res.ok) throw new Error('API unavailable');
    state.activeUser = await res.json();
    updateActiveUserUI();
  } catch (err) {
    state.useOfflineFallback = true;
    switchActiveUser(userId);
  }
}

function updateActiveUserUI() {
  DOM.activeUserAvatar.src = state.activeUser.avatar;
  DOM.activeUserName.textContent = state.activeUser.name;
  DOM.activeUserHandle.textContent = `@${state.activeUser.username}`;
  DOM.composerUserAvatar.src = state.activeUser.avatar;

  DOM.widgetUserAvatar.src = state.activeUser.avatar;
  DOM.widgetUserName.textContent = state.activeUser.name;
  DOM.widgetUserHandle.textContent = `@${state.activeUser.username}`;
  DOM.widgetFollowers.textContent = state.activeUser.followers_count || 0;
  DOM.widgetFollowing.textContent = state.activeUser.following_count || 0;

  renderUsersDropdown();
  renderSuggestedUsers();

  if (state.currentView === 'feed') {
    loadFeed();
  } else if (state.currentView === 'profile' && state.viewingProfileId === state.activeUserId) {
    loadUserProfileDetails(state.activeUserId);
  }
}

function renderUsersDropdown() {
  DOM.usersDropdownList.innerHTML = state.users.map(u => `
    <div class="user-option-item ${u.id === state.activeUserId ? 'active' : ''}" onclick="switchActiveUser(${u.id})">
      <img src="${u.avatar}" alt="${u.name}" class="avatar-sm">
      <div class="user-meta">
        <span class="user-fullname">${escapeHTML(u.name)}</span>
        <span class="user-handle">@${escapeHTML(u.username)}</span>
      </div>
    </div>
  `).join('');
}

function renderSuggestedUsers() {
  const suggested = state.users.filter(u => u.id !== state.activeUserId);
  DOM.suggestedUsersList.innerHTML = suggested.map(u => `
    <div class="suggested-item">
      <div class="suggested-info" onclick="navigateToProfile(${u.id})">
        <img src="${u.avatar}" alt="${u.name}" class="avatar-sm">
        <div>
          <div class="user-fullname" style="font-size: 13px;">${escapeHTML(u.name)}</div>
          <div class="user-handle">@${escapeHTML(u.username)}</div>
        </div>
      </div>
      <button class="btn btn-sm ${u.is_followed ? 'btn-secondary' : 'btn-primary'}" onclick="toggleFollowUser(${u.id}, ${u.is_followed})">
        ${u.is_followed ? 'Following' : 'Follow'}
      </button>
    </div>
  `).join('');
}

async function handleCreateAccount(e) {
  e.preventDefault();
  const username = DOM.newUsername.value.trim().toLowerCase().replace(/\s+/g, '_');
  const name = DOM.newName.value.trim();
  const avatar = DOM.newAvatar.value.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  const bio = DOM.newBio.value.trim() || 'Hello! I am new on PulseNet.';

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const newId = db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const newUser = { id: newId, username, name, avatar, bio, created_at: new Date().toISOString() };
    db.users.push(newUser);
    LocalDB.save(db);

    DOM.modalNewAccount.classList.add('hidden');
    DOM.formNewAccount.reset();
    await loadUsers();
    await switchActiveUser(newId);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name, avatar, bio })
    });

    const data = await res.json();
    if (res.ok) {
      DOM.modalNewAccount.classList.add('hidden');
      DOM.formNewAccount.reset();
      await loadUsers();
      await switchActiveUser(data.id);
    } else {
      alert(data.error || 'Failed to create user account');
    }
  } catch (err) {
    console.error('Error creating user:', err);
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const name = DOM.editName.value.trim();
  const avatar = DOM.editAvatar.value.trim();
  const bio = DOM.editBio.value.trim();

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const u = db.users.find(usr => usr.id === state.activeUserId);
    if (u) {
      if (name) u.name = name;
      if (avatar) u.avatar = avatar;
      if (bio) u.bio = bio;
      LocalDB.save(db);
    }
    DOM.modalEditProfile.classList.add('hidden');
    await loadUsers();
    await switchActiveUser(state.activeUserId);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${state.activeUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, bio })
    });

    if (res.ok) {
      DOM.modalEditProfile.classList.add('hidden');
      await loadUsers();
      await switchActiveUser(state.activeUserId);
    }
  } catch (err) {
    console.error('Error updating profile:', err);
  }
}

/* ================= POSTS & FEED ================= */

async function loadFeed() {
  DOM.postsContainer.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading pulses...</div>';

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    let posts = db.posts.map(p => {
      const u = db.users.find(usr => usr.id === p.user_id) || { username: 'user', name: 'User', avatar: '' };
      const likes_count = db.likes.filter(l => l.post_id === p.id).length;
      const comments_count = db.comments.filter(c => c.post_id === p.id).length;
      const is_liked = db.likes.some(l => l.post_id === p.id && l.user_id === state.activeUserId) ? 1 : 0;
      return { ...p, username: u.username, name: u.name, avatar: u.avatar, likes_count, comments_count, is_liked };
    });

    if (state.currentFeedTab === 'following') {
      const followingIds = db.follows.filter(f => f.follower_id === state.activeUserId).map(f => f.following_id);
      followingIds.push(state.activeUserId);
      posts = posts.filter(p => followingIds.includes(p.user_id));
    }

    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    state.posts = posts;
    renderPosts(state.posts, DOM.postsContainer);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/posts?feed=${state.currentFeedTab}&current_user_id=${state.activeUserId}`);
    if (!res.ok) throw new Error('API unavailable');
    state.posts = await res.json();
    renderPosts(state.posts, DOM.postsContainer);
  } catch (err) {
    state.useOfflineFallback = true;
    loadFeed();
  }
}

async function handleCreatePost() {
  const content = DOM.postContentInput.value.trim();
  const image_url = DOM.postImageUrlInput.value.trim();

  if (!content) {
    alert('Please enter post content.');
    return;
  }

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const newId = db.posts.length ? Math.max(...db.posts.map(p => p.id)) + 1 : 1;
    db.posts.push({
      id: newId,
      user_id: state.activeUserId,
      content,
      image_url: image_url || null,
      created_at: new Date().toISOString()
    });
    LocalDB.save(db);

    DOM.postContentInput.value = '';
    DOM.postImageUrlInput.value = '';
    DOM.postImageUrlInput.classList.add('hidden');
    DOM.imagePreviewContainer.classList.add('hidden');
    loadFeed();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: state.activeUserId, content, image_url })
    });

    if (res.ok) {
      DOM.postContentInput.value = '';
      DOM.postImageUrlInput.value = '';
      DOM.postImageUrlInput.classList.add('hidden');
      DOM.imagePreviewContainer.classList.add('hidden');
      loadFeed();
    }
  } catch (err) {
    console.error('Error creating post:', err);
  }
}

async function toggleLikePost(postId, isLiked) {
  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    if (isLiked) {
      db.likes = db.likes.filter(l => !(l.post_id === postId && l.user_id === state.activeUserId));
    } else {
      const newId = db.likes.length ? Math.max(...db.likes.map(l => l.id)) + 1 : 1;
      db.likes.push({ id: newId, post_id: postId, user_id: state.activeUserId });
    }
    LocalDB.save(db);

    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) {
      const likeBtn = postCard.querySelector('.like-btn');
      const likeCountSpan = postCard.querySelector('.like-count');
      const newCount = db.likes.filter(l => l.post_id === postId).length;
      if (!isLiked) {
        likeBtn.classList.add('liked');
        likeBtn.setAttribute('onclick', `toggleLikePost(${postId}, 1)`);
      } else {
        likeBtn.classList.remove('liked');
        likeBtn.setAttribute('onclick', `toggleLikePost(${postId}, 0)`);
      }
      likeCountSpan.textContent = newCount;
    }
    return;
  }

  try {
    const method = isLiked ? 'DELETE' : 'POST';
    const url = isLiked 
      ? `${API_BASE}/posts/${postId}/like?user_id=${state.activeUserId}`
      : `${API_BASE}/posts/${postId}/like`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: isLiked ? null : JSON.stringify({ user_id: state.activeUserId })
    });

    const data = await res.json();
    if (res.ok) {
      const postCard = document.querySelector(`[data-post-id="${postId}"]`);
      if (postCard) {
        const likeBtn = postCard.querySelector('.like-btn');
        const likeCountSpan = postCard.querySelector('.like-count');
        if (data.is_liked) {
          likeBtn.classList.add('liked');
          likeBtn.setAttribute('onclick', `toggleLikePost(${postId}, 1)`);
        } else {
          likeBtn.classList.remove('liked');
          likeBtn.setAttribute('onclick', `toggleLikePost(${postId}, 0)`);
        }
        likeCountSpan.textContent = data.likes_count;
      }
    }
  } catch (err) {
    console.error('Error toggling like:', err);
  }
}

async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    db.posts = db.posts.filter(p => p.id !== postId);
    db.comments = db.comments.filter(c => c.post_id !== postId);
    db.likes = db.likes.filter(l => l.post_id !== postId);
    LocalDB.save(db);

    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) postCard.remove();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: state.activeUserId })
    });

    if (res.ok) {
      const postCard = document.querySelector(`[data-post-id="${postId}"]`);
      if (postCard) postCard.remove();
    }
  } catch (err) {
    console.error('Error deleting post:', err);
  }
}

/* ================= COMMENTS ================= */

async function toggleComments(postId) {
  const container = document.getElementById(`comments-section-${postId}`);
  if (!container) return;

  if (state.openCommentsPostIds.has(postId)) {
    state.openCommentsPostIds.delete(postId);
    container.classList.add('hidden');
  } else {
    state.openCommentsPostIds.add(postId);
    container.classList.remove('hidden');
    await fetchAndRenderComments(postId);
  }
}

async function fetchAndRenderComments(postId) {
  const listContainer = document.getElementById(`comments-list-${postId}`);
  if (!listContainer) return;

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const comments = db.comments
      .filter(c => c.post_id === postId)
      .map(c => {
        const u = db.users.find(usr => usr.id === c.user_id) || { name: 'User', avatar: '' };
        return { ...c, name: u.name, avatar: u.avatar };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    listContainer.innerHTML = comments.map(c => `
      <div class="comment-item">
        <img src="${c.avatar}" alt="${c.name}" class="avatar-sm" onclick="navigateToProfile(${c.user_id})">
        <div class="comment-content-box">
          <span class="comment-author" onclick="navigateToProfile(${c.user_id})">${escapeHTML(c.name)}</span>
          <span class="comment-text">${escapeHTML(c.content)}</span>
          <span class="comment-time">${formatTimeAgo(c.created_at)}</span>
        </div>
        ${c.user_id === state.activeUserId ? `
          <button class="btn-icon" style="font-size: 11px;" onclick="deleteComment(${c.id}, ${postId})"><i class="fa-solid fa-trash"></i></button>
        ` : ''}
      </div>
    `).join('') || '<div style="font-size: 12px; color: var(--text-muted); padding: 4px;">No comments yet. Be the first to comment!</div>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
    const comments = await res.json();

    listContainer.innerHTML = comments.map(c => `
      <div class="comment-item">
        <img src="${c.avatar}" alt="${c.name}" class="avatar-sm" onclick="navigateToProfile(${c.user_id})">
        <div class="comment-content-box">
          <span class="comment-author" onclick="navigateToProfile(${c.user_id})">${escapeHTML(c.name)}</span>
          <span class="comment-text">${escapeHTML(c.content)}</span>
          <span class="comment-time">${formatTimeAgo(c.created_at)}</span>
        </div>
        ${c.user_id === state.activeUserId ? `
          <button class="btn-icon" style="font-size: 11px;" onclick="deleteComment(${c.id}, ${postId})"><i class="fa-solid fa-trash"></i></button>
        ` : ''}
      </div>
    `).join('') || '<div style="font-size: 12px; color: var(--text-muted); padding: 4px;">No comments yet. Be the first to comment!</div>';
  } catch (err) {
    console.error('Error loading comments:', err);
  }
}

async function handleAddComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input ? input.value.trim() : '';

  if (!content) return;

  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const newId = db.comments.length ? Math.max(...db.comments.map(c => c.id)) + 1 : 1;
    db.comments.push({
      id: newId,
      post_id: postId,
      user_id: state.activeUserId,
      content,
      created_at: new Date().toISOString()
    });
    LocalDB.save(db);

    input.value = '';
    const newCount = db.comments.filter(c => c.post_id === postId).length;
    const countSpan = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
    if (countSpan) countSpan.textContent = newCount;

    fetchAndRenderComments(postId);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: state.activeUserId, content })
    });

    if (res.ok) {
      input.value = '';
      const data = await res.json();
      const countSpan = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
      if (countSpan) countSpan.textContent = data.comments_count;

      fetchAndRenderComments(postId);
    }
  } catch (err) {
    console.error('Error adding comment:', err);
  }
}

async function deleteComment(commentId, postId) {
  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    db.comments = db.comments.filter(c => c.id !== commentId);
    LocalDB.save(db);

    const newCount = db.comments.filter(c => c.post_id === postId).length;
    const countSpan = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
    if (countSpan) countSpan.textContent = newCount;

    fetchAndRenderComments(postId);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: state.activeUserId })
    });

    if (res.ok) {
      const data = await res.json();
      const countSpan = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
      if (countSpan) countSpan.textContent = data.comments_count;

      fetchAndRenderComments(postId);
    }
  } catch (err) {
    console.error('Error deleting comment:', err);
  }
}

/* ================= FOLLOW / UNFOLLOW ================= */

async function toggleFollowUser(targetUserId, isFollowed) {
  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    if (isFollowed) {
      db.follows = db.follows.filter(f => !(f.follower_id === state.activeUserId && f.following_id === targetUserId));
    } else {
      db.follows.push({ follower_id: state.activeUserId, following_id: targetUserId });
    }
    LocalDB.save(db);

    await loadUsers();
    await switchActiveUser(state.activeUserId);
    if (state.currentView === 'explore') loadExplorePeople();
    if (state.currentView === 'profile') loadUserProfileDetails(state.viewingProfileId);
    return;
  }

  try {
    const method = isFollowed ? 'DELETE' : 'POST';
    const url = isFollowed 
      ? `${API_BASE}/users/${targetUserId}/follow?follower_id=${state.activeUserId}`
      : `${API_BASE}/users/${targetUserId}/follow`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: isFollowed ? null : JSON.stringify({ follower_id: state.activeUserId })
    });

    if (res.ok) {
      await loadUsers();
      await switchActiveUser(state.activeUserId);
      if (state.currentView === 'explore') loadExplorePeople();
      if (state.currentView === 'profile') loadUserProfileDetails(state.viewingProfileId);
    }
  } catch (err) {
    console.error('Error toggling follow:', err);
  }
}

async function handleProfileFollowToggle() {
  const isFollowed = DOM.btnFollowUser.dataset.followed === 'true';
  await toggleFollowUser(state.viewingProfileId, isFollowed);
}

/* ================= EXPLORE & PROFILE VIEWS ================= */

function loadExplorePeople() {
  DOM.peopleGrid.innerHTML = state.users.map(u => `
    <div class="person-card">
      <img src="${u.avatar}" alt="${u.name}" class="avatar-lg">
      <h4 onclick="navigateToProfile(${u.id})" style="cursor: pointer;">${escapeHTML(u.name)}</h4>
      <div class="user-handle">@${escapeHTML(u.username)}</div>
      <p class="bio">${escapeHTML(u.bio || 'No bio provided.')}</p>
      ${u.id !== state.activeUserId ? `
        <button class="btn btn-sm ${u.is_followed ? 'btn-secondary' : 'btn-primary'}" onclick="toggleFollowUser(${u.id}, ${u.is_followed})">
          ${u.is_followed ? '<i class="fa-solid fa-check"></i> Following' : '<i class="fa-solid fa-user-plus"></i> Follow'}
        </button>
      ` : '<span class="badge" style="font-size: 12px; color: var(--text-muted);">It\'s You</span>'}
    </div>
  `).join('');
}

async function loadUserProfileDetails(userId) {
  if (state.useOfflineFallback) {
    const db = LocalDB.get();
    const user = db.users.find(usr => usr.id === parseInt(userId));
    if (!user) return;

    const followers_count = db.follows.filter(f => f.following_id === user.id).length;
    const following_count = db.follows.filter(f => f.follower_id === user.id).length;
    const is_followed = db.follows.some(f => f.follower_id === state.activeUserId && f.following_id === user.id);

    DOM.profileAvatar.src = user.avatar;
    DOM.profileName.textContent = user.name;
    DOM.profileHandle.textContent = `@${user.username}`;
    DOM.profileBio.textContent = user.bio || 'No bio added yet.';
    DOM.profileDate.textContent = formatDate(user.created_at);
    DOM.profileFollowersCount.textContent = followers_count;
    DOM.profileFollowingCount.textContent = following_count;
    DOM.profilePostsUser.textContent = user.name;

    if (parseInt(userId) === parseInt(state.activeUserId)) {
      DOM.btnEditProfile.classList.remove('hidden');
      DOM.btnFollowUser.classList.add('hidden');
    } else {
      DOM.btnEditProfile.classList.add('hidden');
      DOM.btnFollowUser.classList.remove('hidden');
      DOM.btnFollowUser.dataset.followed = is_followed ? 'true' : 'false';
      DOM.btnFollowUser.className = `btn ${is_followed ? 'btn-secondary' : 'btn-primary'}`;
      DOM.btnFollowUser.innerHTML = is_followed 
        ? '<i class="fa-solid fa-user-check"></i> Following' 
        : '<i class="fa-solid fa-user-plus"></i> Follow';
    }

    const userPosts = db.posts
      .filter(p => p.user_id === parseInt(userId))
      .map(p => {
        const likes_count = db.likes.filter(l => l.post_id === p.id).length;
        const comments_count = db.comments.filter(c => c.post_id === p.id).length;
        const is_liked = db.likes.some(l => l.post_id === p.id && l.user_id === state.activeUserId) ? 1 : 0;
        return { ...p, username: user.username, name: user.name, avatar: user.avatar, likes_count, comments_count, is_liked };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    DOM.profilePostsCount.textContent = userPosts.length;
    renderPosts(userPosts, DOM.profilePostsContainer);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${userId}?current_user_id=${state.activeUserId}`);
    const user = await res.json();

    DOM.profileAvatar.src = user.avatar;
    DOM.profileName.textContent = user.name;
    DOM.profileHandle.textContent = `@${user.username}`;
    DOM.profileBio.textContent = user.bio || 'No bio added yet.';
    DOM.profileDate.textContent = formatDate(user.created_at);
    DOM.profileFollowersCount.textContent = user.followers_count || 0;
    DOM.profileFollowingCount.textContent = user.following_count || 0;
    DOM.profilePostsUser.textContent = user.name;

    if (parseInt(userId) === parseInt(state.activeUserId)) {
      DOM.btnEditProfile.classList.remove('hidden');
      DOM.btnFollowUser.classList.add('hidden');
    } else {
      DOM.btnEditProfile.classList.add('hidden');
      DOM.btnFollowUser.classList.remove('hidden');
      DOM.btnFollowUser.dataset.followed = user.is_followed ? 'true' : 'false';
      DOM.btnFollowUser.className = `btn ${user.is_followed ? 'btn-secondary' : 'btn-primary'}`;
      DOM.btnFollowUser.innerHTML = user.is_followed 
        ? '<i class="fa-solid fa-user-check"></i> Following' 
        : '<i class="fa-solid fa-user-plus"></i> Follow';
    }

    const postsRes = await fetch(`${API_BASE}/posts?feed=user&user_id=${userId}&current_user_id=${state.activeUserId}`);
    const posts = await postsRes.json();
    DOM.profilePostsCount.textContent = posts.length;
    renderPosts(posts, DOM.profilePostsContainer);
  } catch (err) {
    console.error('Error loading user profile:', err);
  }
}

/* ================= POST RENDERER ================= */

function renderPosts(postsList, container) {
  if (postsList.length === 0) {
    container.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">No pulses found here yet.</div>';
    return;
  }

  container.innerHTML = postsList.map(post => `
    <div class="card post-card" data-post-id="${post.id}">
      <div class="post-header">
        <div class="author-info" onclick="navigateToProfile(${post.user_id})">
          <img src="${post.avatar}" alt="${post.name}" class="avatar-md">
          <div class="author-names">
            <span class="author-fullname">${escapeHTML(post.name)}</span>
            <span class="author-username">@${escapeHTML(post.username)}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="post-date">${formatTimeAgo(post.created_at)}</span>
          ${post.user_id === state.activeUserId ? `
            <button class="btn-icon" style="color: var(--text-muted);" onclick="deletePost(${post.id})"><i class="fa-solid fa-trash"></i></button>
          ` : ''}
        </div>
      </div>

      <div class="post-content">${escapeHTML(post.content)}</div>

      ${post.image_url ? `
        <div class="post-image-container">
          <img src="${post.image_url}" alt="Post image" loading="lazy">
        </div>
      ` : ''}

      <div class="post-actions">
        <button class="action-btn like-btn ${post.is_liked ? 'liked' : ''}" onclick="toggleLikePost(${post.id}, ${post.is_liked})">
          <i class="fa-solid fa-heart"></i>
          <span class="like-count">${post.likes_count}</span>
        </button>
        <button class="action-btn" onclick="toggleComments(${post.id})">
          <i class="fa-solid fa-comment"></i>
          <span class="comment-count">${post.comments_count}</span>
        </button>
      </div>

      <div class="comments-section ${state.openCommentsPostIds.has(post.id) ? '' : 'hidden'}" id="comments-section-${post.id}">
        <div class="comments-list" id="comments-list-${post.id}"></div>
        <div class="add-comment-box">
          <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." onkeypress="if(event.key==='Enter') handleAddComment(${post.id})">
          <button class="btn btn-sm btn-primary" onclick="handleAddComment(${post.id})">Reply</button>
        </div>
      </div>
    </div>
  `).join('');

  postsList.forEach(post => {
    if (state.openCommentsPostIds.has(post.id)) {
      fetchAndRenderComments(post.id);
    }
  });
}

/* ================= HELPERS ================= */

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function formatDate(dateString) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
