# Roles & Permissions

Permissions are enforced **server-side and in Supabase Row Level Security**, never only hidden in the interface.

| Action | Artist | Organiser | Curator/Editor | Org Admin | ArteGO Admin |
|---|---|---|---|---|---|
| Edit own artist profile | Yes | If own | If permitted | If linked | Yes |
| Add/edit own artworks | Yes | If own | Only if delegated | If role permits | Yes |
| Create portfolio/catalogue | Yes | Yes | If project role | Yes | Yes |
| Create virtual gallery | Yes | Yes | If project role | Yes | Yes |
| Create exhibition | Yes | Yes | If permitted | Yes | Yes |
| Invite artists | Own exhibition | Yes | If permitted | Yes | Yes |
| Review submissions | Only if organiser | Yes | Yes | Yes | Yes |
| Publish exhibition | Owner | Owner/Admin | If permitted | Yes | Yes |
| Verify artist | No | No | No | No | Yes |
| Suspend user | No | No | No | No | Yes |
| Unpublish public content | Own content | Own project | If permitted | Own org/project | Yes |
| Permanent delete | Own draft only | Restricted | No | Restricted | Restricted + audit |

An exhibition is a **project workspace**, not a separate account. The owner invites collaborators with a role:
Owner, Admin, Curator, Editor, Artist, Viewer.

## Visibility model

| Visibility | Meaning |
|---|---|
| Public | Searchable and discoverable |
| Unlisted | Accessible by direct link, not in public search |
| Private | Owner and collaborators only |
| Archived | Hidden from normal use; retained for record |

## RLS acceptance test (must pass)

Logged in as User A, User B's private artwork must be unreachable by:
- the public Discover page
- a direct URL guess
- the API
- the public sitemap
- a cached page after logout
