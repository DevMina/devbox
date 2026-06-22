// ── DevBox Sidebar Navigation ──
// Detects if we're at root (index.html) or inside /tools/ and sets paths accordingly

function buildSidebar() {
  const isRoot = !window.location.pathname.includes('/tools/');
  const base = isRoot ? 'tools/' : '';
  const home = isRoot ? 'index.html' : '../index.html';

  const ITEMS = [
    { section: 'Format' },
    { href: 'json.html',           label: 'JSON',              dot: '--green'  },
    { href: 'jsonpath.html',       label: 'JSON Path',         dot: '--green'  },
    { section: 'Encode' },
    { href: 'base64.html',         label: 'Base64',            dot: '--blue'   },
    { href: 'url.html',            label: 'URL Encoder',       dot: '--cyan'   },
    { href: 'htmlentity.html',     label: 'HTML Entities',     dot: '--green'  },
    { section: 'Generate' },
    { href: 'uuid.html',           label: 'UUID',              dot: '--orange' },
    { href: 'hash.html',           label: 'Hash',              dot: '--cyan'   },
    { href: 'password.html',       label: 'Password',          dot: '--pink'   },
    { href: 'lorem.html',          label: 'Lorem Ipsum',       dot: '--cyan'   },
    { href: 'asciiart.html',       label: 'ASCII Art',         dot: '--purple' },
    { href: 'qrcode.html',         label: 'QR Code',           dot: '--green'  },
    { href: 'favicon.html',        label: 'Favicon',           dot: '--cyan'   },
    { section: 'Color' },
    { href: 'color.html',          label: 'Color Converter',   dot: '--pink'   },
    { href: 'contrast.html',       label: 'Contrast Checker',  dot: '--green'  },
    { href: 'colorpalette.html',   label: 'Color Palette',     dot: '--pink'   },
    { href: 'gradient.html',       label: 'CSS Gradient',      dot: '--pink'   },
    { href: 'imagepalette.html',   label: 'Image Palette',     dot: '--orange' },
    { section: 'Inspect' },
    { href: 'jwt.html',            label: 'JWT Decoder',       dot: '--purple' },
    { href: 'jwtencoder.html',     label: 'JWT Encoder',       dot: '--purple' },
    { href: 'timestamp.html',      label: 'Timestamp',         dot: '--yellow' },
    { href: 'regex.html',          label: 'Regex Tester',      dot: '--red'    },
    { href: 'httpstatus.html',     label: 'HTTP Status',       dot: '--red'    },
    { href: 'headerbuilder.html',  label: 'Header Builder',    dot: '--purple' },
    { href: 'useragent.html',      label: 'User Agent',        dot: '--teal'   },
    { href: 'keytester.html',      label: 'Key Tester',        dot: '--blue'   },
    { section: 'Convert' },
    { href: 'numbase.html',        label: 'Number Base',       dot: '--orange' },
    { href: 'byteconvert.html',    label: 'Byte Converter',    dot: '--purple' },
    { href: 'aspectratio.html',    label: 'Aspect Ratio',      dot: '--cyan'   },
    { href: 'jsoncsvconvert.html', label: 'JSON ↔ CSV',        dot: '--green'  },
    { href: 'caseconvert.html',    label: 'Case Converter',    dot: '--green'  },
    { href: 'numberfmt.html',      label: 'Number Format',     dot: '--red'    },
    { href: 'matheval.html',       label: 'Math Evaluator',    dot: '--yellow' },
    { section: 'Text' },
    { href: 'diff.html',           label: 'Diff Checker',      dot: '--teal'   },
    { href: 'textstats.html',      label: 'Text Stats',        dot: '--blue'   },
    { href: 'charcounter.html',    label: 'Char Counter',      dot: '--teal'   },
    { href: 'linesorter.html',     label: 'Line Sorter',       dot: '--yellow' },
    { href: 'markdown.html',       label: 'Markdown Preview',  dot: '--blue'   },
    { href: 'tablebuilder.html',   label: 'Table Builder',     dot: '--orange' },
    { href: 'textencrypt.html',    label: 'Text Encrypt',      dot: '--yellow' },
    { section: 'Code' },
    { href: 'sqlformat.html',      label: 'SQL Formatter',     dot: '--orange' },
    { href: 'cssminify.html',      label: 'CSS Minifier',      dot: '--pink'   },
    { href: 'htmlbeautify.html',   label: 'HTML Beautifier',   dot: '--orange' },
    { href: 'snippets.html',       label: 'Snippet Manager',   dot: '--teal'   },
    { section: 'Network' },
    { href: 'ipcalc.html',         label: 'IP Calculator',     dot: '--blue'   },
    { href: 'cron.html',           label: 'Cron Parser',       dot: '--yellow' },
    { href: 'nettools.html',       label: 'Network Tools',     dot: '--blue'   },
    { href: 'seotools.html',       label: 'SEO Tools',         dot: '--green'  },
    { section: 'Productivity' },
    { href: 'pomodoro.html',       label: 'Pomodoro Timer',    dot: '--red'    },
    { href: 'countdown.html',      label: 'Countdown',         dot: '--pink'   },
    { href: 'breakpoints.html',    label: 'Breakpoint Tester', dot: '--cyan'   },
  ];

  // Determine current page filename for active highlighting
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  let html = `
    <a class="sidebar-logo" href="${home}">
      <div class="logo-mark">{}</div>
      <div class="logo-text">Dev<span>Box</span></div>
    </a>
    <nav class="nav">`;

  ITEMS.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section-label">${item.section}</div>`;
    } else {
      const fullHref = base + item.href;
      const isActive = currentFile === item.href;
      html += `
      <a class="nav-item${isActive ? ' active' : ''}" href="${fullHref}">
        <div class="nav-dot" style="background:var(${item.dot})"></div>
        <span>${item.label}</span>
      </a>`;
    }
  });

  html += `</nav>`;
  return html;
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = buildSidebar();
});
