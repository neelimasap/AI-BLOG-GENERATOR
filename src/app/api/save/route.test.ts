/** @jest-environment node */

import { POST } from '@/app/api/save/route';

const generateImageMock = jest.fn();
const insertMock = jest.fn();
const selectMock = jest.fn();
const singleMock = jest.fn();
const maybeSingleMock = jest.fn();
const limitMock = jest.fn();
const orderMock = jest.fn();
const eqMock = jest.fn();
const fromMock = jest.fn();
const getSupabaseServerMock = jest.fn();

jest.mock('@/lib/ai/fal', () => ({
  generateImage: (...args: unknown[]) => generateImageMock(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => getSupabaseServerMock(),
}));

describe('POST /api/save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    singleMock.mockResolvedValue({ data: { id: 'post-1' }, error: null });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    limitMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    orderMock.mockReturnValue({ limit: limitMock });
    eqMock
      .mockReturnValueOnce({ eq: eqMock })
      .mockReturnValueOnce({ order: orderMock });
    selectMock.mockReturnValue({ single: singleMock });
    insertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({
      select: () => ({ eq: eqMock }),
      insert: insertMock,
    });
    getSupabaseServerMock.mockReturnValue({ from: fromMock });
    generateImageMock.mockResolvedValue({ url: 'https://cdn.example.com/generated-cover.png' });
  });

  it('generates a cover image during save when the client has not attached one yet', async () => {
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
    expect(maybeSingleMock).toHaveBeenCalled();
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
      image_url: 'https://cdn.example.com/generated-cover.png',
      sources: [
        {
          title: 'Example',
          url: 'https://example.com',
          snippet: 'Snippet',
        },
      ],
    });
    expect(generateImageMock).toHaveBeenCalledWith(
      expect.stringContaining('Blog cover image for "Test"'),
      'photorealistic',
    );
  });

  it('uses the provided image URL without generating a new one', async () => {
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
        image_url: 'https://cdn.example.com/client-image.png',
        sources: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(generateImageMock).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      image_url: 'https://cdn.example.com/client-image.png',
    }));
  });

  it('returns the existing saved post instead of inserting a duplicate', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: 'existing-post', topic: 'Test topic' },
      error: null,
    });

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
        image_url: 'https://cdn.example.com/client-image.png',
        sources: [],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: 'existing-post', topic: 'Test topic' });
    expect(insertMock).not.toHaveBeenCalled();
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
