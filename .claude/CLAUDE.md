# Code Squad

VS Code / Cursor 확장 프로그램 + CLI.

## Repository Structure

- `code-squad-dev` (private): 개발용, docs/specs 포함
- `code-squad` (public): 오픈소스 공개용, docs/specs 제외

## Deployment Flow

```
code-squad-dev (private)
     │
     ├── main push ──▶ CI ──▶ code-squad (public) 코드 sync
     │                        (specs, docs 제외)
     │
     ├── v* 태그 push ──▶ CI ──▶ public에 태그 push
     │                                │
     │                                ▼
     │                         publish.yml 실행
     │                         → VS Code Marketplace
     │                         → Open VSX (Cursor)
     │
     └── cli-v* 태그 push ──▶ CI ──▶ public에 태그 push
                                      │
                                      ▼
                               publish-cli.yml 실행
                               → npm publish
```

### VS Code Extension 릴리즈

```bash
git tag v1.2.3
git push origin v1.2.3
```

### CLI 릴리즈

```bash
git tag cli-v1.0.0
git push origin cli-v1.0.0
```

## Private Only

다음 파일/폴더는 private repo에만 존재:

- `specs/` - siat 워크플로우 문서
- `docs/` - 설계 문서, 변경 기록, 플랜 등
- `.claude/CLAUDE.md` - 이 파일
