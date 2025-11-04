# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Logga in
      - paragraph [ref=e6]: Använd dina administratörsuppgifter för att fortsätta
    - generic [ref=e8]:
      - generic [ref=e9]:
        - text: E-postadress
        - textbox "E-postadress" [ref=e10]:
          - /placeholder: namn@forening.se
          - text: admin@crm.se
      - generic [ref=e11]:
        - text: Lösenord
        - textbox "Lösenord" [ref=e12]:
          - /placeholder: ••••••
      - button "Logga in" [ref=e13] [cursor=pointer]
    - generic [ref=e15]: Behöver du ett konto? Kontakta systemadministratören.
  - region "Notifications (F8)":
    - list
  - status [ref=e16]:
    - generic [ref=e17]:
      - img [ref=e19]
      - generic [ref=e21]:
        - text: Static route
        - button "Hide static indicator" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
  - alert [ref=e26]
```