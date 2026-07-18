/**
 * Vercel Routing Middleware: injects real per-video Open Graph / Twitter meta
 * tags into player.html, but ONLY for known social-preview crawlers.
 * Real visitors get the untouched SPA (client-side JS still updates the UI).
 *
 * Covers both your desktop and mobile player pages, with or without the
 * .html extension (Vercel's clean URLs strip it for the links you actually
 * share, e.g. /player?video=xyz instead of /player.html?video=xyz):
 *   /player.html or /player      (main/desktop)
 *   /m/player.html or /m/player  (mobile)
 *
 * Setup:
 *  1. Put this file at the ROOT of your project (same level as package.json,
 *     i.e. one level above both your main/ and m/ folders).
 *  2. If this isn't a Next.js project, either:
 *       a) add  "type": "module"  to package.json, or
 *       b) rename this file to middleware.mjs
 *  3. Deploy: `vercel --prod`. No extra config needed — the matcher below
 *     scopes it to just those two files, everything else passes through as-is.
 */

export const config = {
  matcher: ['/player.html', '/player', '/m/player.html', '/m/player'],
};

const BOT_UA = /facebookexternalhit|Twitterbot|Discordbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Pinterest|SkypeUriPreview|vkShare/i;

const API = 'https://kctv.koryofront.org/api/media-list';
const THUMB_API = 'https://koryofront.org/api/kctv/thumb';

export default async function middleware(request) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get('video');
  const ua = request.headers.get('user-agent') || '';

  // Always fetch the real static file so behavior is identical either way
  const pageRes = await fetch(url);

  if (!videoId || !BOT_UA.test(ua)) {
    return pageRes; // pass through untouched for real users / non-bot requests
  }

  const video = await findVideo(videoId);
  let html = await pageRes.text();
  if (!video) return new Response(html, pageRes);

  const title = `${video.title} — Juche TV VOD`;
  const desc = `Watch "${video.title}," a ${video.category} broadcast from Korean Central ` +
               `Television, originally aired ${video.date}. Streamed on-demand on Juche TV, ` +
               `an archive of DPRK television.`;
  const thumb = `${THUMB_API}?path=${encodeURI('/recordings/' + video.category + '/' + video.filename)}&t=5`;
  const shareUrl = `${url.origin}${url.pathname}?video=${videoId}`;

  html = replaceMeta(html, 'name="description"', desc);
  html = replaceMeta(html, 'property="og:title"', title);
  html = replaceMeta(html, 'property="og:description"', desc);
  html = replaceMeta(html, 'property="og:image"', thumb);
  html = replaceMeta(html, 'property="og:url"', shareUrl);
  html = replaceMeta(html, 'name="twitter:title"', title);
  html = replaceMeta(html, 'name="twitter:description"', desc);
  html = replaceMeta(html, 'name="twitter:image"', thumb);

  return new Response(html, {
    status: 200,
    headers: { ...Object.fromEntries(pageRes.headers), 'content-type': 'text/html;charset=UTF-8' },
  });
}

async function findVideo(videoId) {
  const res = await fetch(API);
  if (!res.ok) return null;
  const data = await res.json();
  for (const cat of Object.keys(data)) {
    for (const item of data[cat] || []) {
      if (shortId(cat + '|' + item.filename) === videoId) {
        return { ...item, category: item.category || cat };
      }
    }
  }
  return null;
}

// Must exactly match the shortId() hash used client-side in player.html/VOD.html
function shortId(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

function replaceMeta(html, attrMatch, value) {
  const re = new RegExp(`(<meta[^>]*${attrMatch}[^>]*content=")[^"]*("[^>]*>)`);
  return html.replace(re, `$1${escapeAttr(value)}$2`);
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
