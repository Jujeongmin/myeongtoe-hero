# Keeps each changed text file's line endings as they were in HEAD (the repo mixes CRLF and LF;
# editors and scripts that rewrite a file whole would otherwise turn every line into a diff).
import subprocess, difflib
files = [f for f in subprocess.check_output(['git','diff','--name-only'], text=True).split() if f.endswith(('.ts','.tsx','.css','.md','.json','.html')) and __import__('os').path.exists(f)]
for f in files:
    head = subprocess.check_output(['git','show','HEAD:'+f]).decode('utf-8').splitlines(keepends=True)
    new = open(f, encoding='utf-8', newline='').read().splitlines(keepends=True)
    hs = [l.rstrip('\r\n') for l in head]; ns = [l.rstrip('\r\n') for l in new]
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, hs, ns, autojunk=False).get_opcodes():
        if tag == 'equal':
            out += head[i1:i2]
        else:
            ref = head[i1] if i1 < len(head) else head[-1]
            eol = '\r\n' if ref.endswith('\r\n') else '\n'
            for k in range(j1, j2):
                last = k == len(ns) - 1 and not new[k].endswith('\n')
                out.append(ns[k] + ('' if last else eol))
    open(f, 'w', encoding='utf-8', newline='').write(''.join(out))
print('ok')
