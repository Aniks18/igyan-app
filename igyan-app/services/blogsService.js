/**
 * iGyan App - Blogs service (ported from igyan-mvp /api/blogs
 * GET/POST/PUT/DELETE on table `blogs`)
 */
import { supabase } from '../utils/supabase';
import { buildSlug } from './apiUtils';

const err = (res, label) => {
  if (res.error) throw new Error(`${label}: ${res.error.message}`);
  return res.data;
};

/**
 * List published blogs with filters + pagination.
 * { type, tag, featured, limit, page }
 */
export async function listBlogs({ type, tag, featured, limit = 50, page = 1 } = {}) {
  const safeLimit = Math.max(1, Math.min(100, limit || 50));
  const safePage = Math.max(1, page || 1);
  const offset = (safePage - 1) * safeLimit;
  let query = supabase
    .from('blogs')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + safeLimit - 1);
  if (type) query = query.eq('blog_type', type);
  if (featured === true || featured === 'true') query = query.eq('is_featured', true);
  if (tag) query = query.contains('tags', [tag]);
  const { data, error, count } = await query;
  if (error) throw new Error(`listBlogs: ${error.message}`);
  return {
    blogs: data || [],
    total: count || 0,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil((count || 0) / safeLimit),
  };
}

/** Fetch a single published blog by slug (increments view count). */
export async function getBlogBySlug(slug) {
  if (!slug) throw new Error('Blog slug is required.');
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) throw new Error('Blog not found.');
  await supabase
    .from('blogs')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('id', data.id);
  return data;
}

/** Create a blog (slug auto-generated from title when missing). */
export async function createBlog(body) {
  const payload = { ...(body || {}) };
  if (!payload.slug && payload.title) payload.slug = buildSlug(payload.title);
  if (payload.is_published && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }
  const res = await supabase.from('blogs').insert([payload]).select().single();
  return err(res, 'createBlog');
}

/** Update a blog by id. */
export async function updateBlog(id, updates) {
  if (!id) throw new Error('Blog id is required.');
  const payload = { ...(updates || {}) };
  if (payload.is_published && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }
  const res = await supabase.from('blogs').update(payload).eq('id', id).select().single();
  return err(res, 'updateBlog');
}

/** Delete a blog by id. */
export async function deleteBlog(id) {
  if (!id) throw new Error('Blog id is required.');
  const res = await supabase.from('blogs').delete().eq('id', id);
  if (res.error) throw new Error(`deleteBlog: ${res.error.message}`);
  return { success: true };
}
