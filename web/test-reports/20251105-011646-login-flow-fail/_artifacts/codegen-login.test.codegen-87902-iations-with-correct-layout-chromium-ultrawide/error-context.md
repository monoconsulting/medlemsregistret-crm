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
      - generic [ref=e11]:
        - text: Lösenord
        - textbox "Lösenord" [ref=e12]:
          - /placeholder: ••••••
      - button "Logga in" [ref=e13] [cursor=pointer]
    - generic [ref=e15]: Behöver du ett konto? Kontakta systemadministratören.
  - region "Notifications (F8)":
    - list
  - alert [ref=e16]
```