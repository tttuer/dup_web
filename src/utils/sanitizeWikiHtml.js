const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol',
  'p', 'pre', 's', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td',
  'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
]);

const GLOBAL_ATTRIBUTES = new Set([
  'align', 'aria-label', 'class', 'colspan', 'id', 'rowspan', 'style', 'title',
]);
const URL_ATTRIBUTES = new Set(['href', 'src']);
const SAFE_IMAGE_DATA_URL = /^data:image\/(gif|jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i;
const REMOVE_WITH_CONTENT_TAGS = new Set(['embed', 'iframe', 'object', 'script', 'style', 'template']);
const SAFE_STYLE_PROPERTIES = new Set([
  'background-color', 'border', 'border-color', 'color', 'display', 'float', 'font-size',
  'font-style', 'font-weight', 'height', 'margin', 'margin-left', 'margin-right', 'max-width',
  'padding', 'text-align', 'text-decoration', 'vertical-align', 'width',
]);

function isSafeUrl(value, tagName, attributeName) {
  const url = value.trim();
  if (!url || url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  if (tagName === 'img' && attributeName === 'src' && SAFE_IMAGE_DATA_URL.test(url)) {
    return true;
  }

  try {
    const protocol = new URL(url, window.location.origin).protocol;
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol);
  } catch {
    return false;
  }
}

function sanitizeInlineStyle(style) {
  return style
    .split(';')
    .map((rule) => rule.split(/:(.+)/))
    .filter(([property, value]) => {
      const normalizedProperty = property?.trim().toLowerCase();
      const normalizedValue = value?.trim().toLowerCase();
      return SAFE_STYLE_PROPERTIES.has(normalizedProperty)
        && normalizedValue
        && !/(expression\s*\(|url\s*\(|@import|javascript:)/.test(normalizedValue);
    })
    .map(([property, value]) => `${property.trim()}: ${value.trim()}`)
    .join('; ');
}

function sanitizeElement(element) {
  [...element.children].forEach((child) => {
    const tagName = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      if (REMOVE_WITH_CONTENT_TAGS.has(tagName)) {
        child.remove();
        return;
      }
      sanitizeElement(child);
      child.replaceWith(...child.childNodes);
      return;
    }

    [...child.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      const isAllowed = GLOBAL_ATTRIBUTES.has(name)
        || (tagName === 'a' && ['href', 'target', 'rel'].includes(name))
        || (tagName === 'img' && ['src', 'alt', 'width', 'height'].includes(name));

      if (!isAllowed || name.startsWith('on')) {
        child.removeAttribute(attribute.name);
        return;
      }

      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(value, tagName, name)) {
        child.removeAttribute(attribute.name);
      }
      if (name === 'style') {
        const safeStyle = sanitizeInlineStyle(value);
        if (safeStyle) child.setAttribute('style', safeStyle);
        else child.removeAttribute('style');
      }
    });

    if (tagName === 'a' && child.getAttribute('target') === '_blank') {
      child.setAttribute('rel', 'noopener noreferrer');
    }
    sanitizeElement(child);
  });
}

/**
 * Keeps standard Markdown/TinyMCE output while removing executable HTML,
 * event handlers, and unsafe URLs before it reaches v-html.
 */
export function sanitizeWikiHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeElement(template.content);
  return template.innerHTML;
}
