INSERT INTO categories (name, slug, type, sort_order) VALUES
  ('자유게시판', 'freeboard', 'community', 10),
  ('생활정보', 'life-info', 'community', 20),
  ('질문답변', 'qna', 'community', 30),
  ('공지사항', 'announcements', 'community', 40),
  ('중고차', 'cars', 'marketplace', 100),
  ('가구', 'furniture', 'marketplace', 110),
  ('전자제품', 'electronics', 'marketplace', 120),
  ('유아용품', 'baby-items', 'marketplace', 130),
  ('파트타임', 'part-time', 'jobs', 200),
  ('풀타임', 'full-time', 'jobs', 210),
  ('구인 업체', 'employer', 'jobs', 220),
  ('렌트', 'rent', 'real-estate', 300),
  ('플랫메이트', 'flatmate', 'real-estate', 310),
  ('부동산 정보', 'property-info', 'real-estate', 320),
  ('업체 디렉토리', 'directory', 'business', 400),
  ('프로모션', 'promotions', 'business', 410),
  ('업체 리뷰', 'reviews', 'business', 420)
ON CONFLICT (slug) DO NOTHING;
