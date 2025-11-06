# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Välkommen!" [level=1] [ref=e4]
      - paragraph [ref=e5]: Logga in för att komma åt CRM-portalen.
      - link "Gå till inloggning" [ref=e7] [cursor=pointer]:
        - /url: /login
  - region "Notifications (F8)":
    - list
  - alert [ref=e8]
```