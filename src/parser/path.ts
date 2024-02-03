const CHAR_DOT = 46; /* . */
const CHAR_FORWARD_SLASH = 47; /* / */

function validateString(value: string, name: string) {
  if (typeof value !== 'string') {
    throw new Error(
      `ERR_INVALID_ARG_TYPE: The "${name}" argument must be of type string. Received type ${typeof value}`
    );
  }
}

function isPosixPathSeparator(code: number | undefined) {
  return code === CHAR_FORWARD_SLASH;
}

function normalizeString(
  path: string,
  allowAboveRoot: boolean,
  separator: string,
  isPathSeparator: (code?: number) => boolean
) {
  let res = '';
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code = 0;
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) {
      code = path.charCodeAt(i);
    } else if (isPathSeparator(code)) {
      break;
    } else {
      code = CHAR_FORWARD_SLASH;
    }

    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = '';
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length !== 0) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? `${separator}..` : '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `${separator}${path.slice(lastSlash + 1, i)}`;
        } else {
          res = path.slice(lastSlash + 1, i);
        }
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function normalize(path: string): string {
  validateString(path, 'path');

  if (path.length === 0) {
    return '.';
  }

  const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
  const trailingSeparator =
    path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;

  path = normalizeString(path, !isAbsolute, '/', isPosixPathSeparator);

  if (path.length === 0) {
    if (isAbsolute) {
      return '/';
    }
    return trailingSeparator ? './' : '.';
  }
  if (trailingSeparator) {
    path += '/';
  }

  return isAbsolute ? `/${path}` : path;
}

export function join(...paths: string[]): string {
  if (paths.length === 0) {
    return '.';
  }
  let joined;
  for (let i = 0; i < paths.length; ++i) {
    const arg = paths[i];
    validateString(arg, 'path');
    if (arg.length > 0) {
      if (joined === undefined) {
        joined = arg;
      } else {
        joined += `/${arg}`;
      }
    }
  }
  if (joined === undefined) {
    return '.';
  }
  return normalize(joined);
}

export function dirname(path: string): string {
  validateString(path, 'path');
  if (path.length === 0) {
    return '.';
  }
  const hasRoot = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
  let end = -1;
  let matchedSlash = true;
  for (let i = path.length - 1; i >= 1; --i) {
    if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) {
    return hasRoot ? '/' : '.';
  }
  if (hasRoot && end === 1) {
    return '//';
  }
  return path.slice(0, end);
}
