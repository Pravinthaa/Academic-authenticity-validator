from pathlib import Path
from html.parser import HTMLParser

class TagTracker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        self.line_offset = 0

    def handle_starttag(self, tag, attrs):
        self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if not self.stack:
            self.errors.append((tag, 'no opening tag', self.getpos()))
            return
        open_tag, pos = self.stack.pop()
        if open_tag != tag:
            self.errors.append((tag, open_tag, pos, self.getpos()))

content = Path('src/pages/VerifierDashboard.jsx').read_text(encoding='utf-8')
# Strip out JS expressions to avoid confusing the HTML parser for tag matching
import re
content_clean = re.sub(r"\{[^{}]*\}", '', content)
parser = TagTracker()
parser.feed(content_clean)
print('Remaining stack:', parser.stack[-5:])
print('Errors:', parser.errors[:10])
