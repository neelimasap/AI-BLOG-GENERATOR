/** @jest-environment node */

import { POST } from '@/app/api/save/route';

const insertMock = jest.fn();
const selectMock = jest.fn();
const singleMock = jest.fn();
const fromMock = jest.fn();
const getSupabaseServerMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => getSupabaseServerMock(),
}));

describe('POST /api/save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    singleMock.mockResolvedValue({ data: { id: 'post-1' }, error: null });
    selectMock.mockReturnValue({ single: singleMock });
    insertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({ insert: insertMock });
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
  });

  it('saves a generated post with sources as a JSON array payload', async () => {
    const request = new Request('http://localhost/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Test topic',
        tone: 'technical',
        audience: 'developers',
        outline: '{"title":"Test"}',
        content: '{"title":"Test"}',
        seo_meta: {
          title: 'SEO title',
          description: 'SEO description',
          keywords: ['a', 'b'],
        },
        sources: [
          {
            title: 'Example',
            url: 'https://example.com',
            snippet: 'Snippet',
          },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ id: 'post-1' });
    expect(fromMock).toHaveBeenCalledWith('generated_posts');
    expect(insertMock).toHaveBeenCalledWith({
      topic: 'Test topic',
      tone: 'technical',
      audience: 'developers',
      outline: '{"title":"Test"}',
      content: '{"title":"Test"}',
      seo_meta: {
        title: 'SEO title',
        description: 'SEO description',
        keywords: ['a', 'b'],
      },
      image_url: null,
      sources: [
        {
          title: 'Example',
          url: 'https://example.com',
          snippet: 'Snippet',
        },
      ],
    });
  });

  it('returns 400 for invalid save payloads', async () => {
    const request = new Request('http://localhost/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
