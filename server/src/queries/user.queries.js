// =============================================
// User SQL Queries — Supabase Auth Compatible
// =============================================
// auth_id links our users table to Supabase's auth.users
// password_hash is no longer stored (managed by Supabase Auth)
// =============================================

export const userQueries = {
  // Find user by email
  findByEmail: `
    SELECT id, name, email, phone, role, is_verified, auth_id, created_at
    FROM users WHERE email = $1
  `,

  // Find user by Supabase auth ID
  findByAuthId: `
    SELECT id, name, email, phone, role, is_verified, created_at
    FROM users WHERE auth_id = $1
  `,

  // Find user by ID
  findById: `
    SELECT id, name, email, phone, role, is_verified, created_at
    FROM users WHERE id = $1
  `,

  // Create a new user (no password_hash — Supabase handles auth)
  create: `
    INSERT INTO users (name, email, phone, role, auth_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, phone, role, is_verified, created_at
  `,

  // Get user with profile
  findWithProfile: `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified, u.created_at,
           p.avatar_url, p.latitude, p.longitude, p.current_city
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = $1
  `,

  // Create or update user profile (upsert)
  upsertProfile: `
    INSERT INTO user_profiles (user_id, avatar_url, latitude, longitude, current_city)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET
      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
      latitude = COALESCE(EXCLUDED.latitude, user_profiles.latitude),
      longitude = COALESCE(EXCLUDED.longitude, user_profiles.longitude),
      current_city = COALESCE(EXCLUDED.current_city, user_profiles.current_city),
      updated_at = NOW()
    RETURNING *
  `,

  // Update user info
  update: `
    UPDATE users SET name = $2, phone = $3 WHERE id = $1
    RETURNING id, name, email, phone, role, is_verified
  `,
};
