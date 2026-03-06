
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    site_id VARCHAR(20) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Мой сайт',
    description TEXT DEFAULT '',
    meta_title VARCHAR(255) DEFAULT '',
    meta_description VARCHAR(500) DEFAULT '',
    og_image VARCHAR(500) DEFAULT '',
    s3_key VARCHAR(500) NOT NULL,
    html_content TEXT,
    prompt TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active',
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES sites(id),
    form_name VARCHAR(100) DEFAULT 'default',
    data JSONB NOT NULL,
    sender_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES sites(id),
    page_path VARCHAR(500) DEFAULT '/',
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referer VARCHAR(500),
    country VARCHAR(10) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sites_user ON sites(user_id);
CREATE INDEX idx_sites_slug ON sites(slug);
CREATE INDEX idx_sites_site_id ON sites(site_id);
CREATE INDEX idx_form_submissions_site ON form_submissions(site_id);
CREATE INDEX idx_analytics_site ON analytics(site_id);
CREATE INDEX idx_analytics_created ON analytics(created_at);
