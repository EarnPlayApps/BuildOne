# BuildOne Legal Contact Configuration

This file is intentionally explicit because BuildOne must never invent legal contact information.

Before public release, replace every value below with the real operator information and run the release gate.

```yaml
product: BuildOne
operator_name: ""
operator_type: ""
registered_address: ""
privacy_email: ""
support_email: ""
security_email: ""
privacy_policy_url: ""
terms_url: ""
app_support_url: ""
country_of_operation: "Malaysia"
retention_policy_url: ""
last_legal_review: ""
```

## Release rule

The BuildOne Publish Center must refuse production publishing when any mandatory field is empty or when Privacy Policy / Terms URLs are not HTTPS.

## Why this is required

The correct legal identity, contact route and jurisdiction depend on the actual operator and business structure. A fabricated email, address or company registration would be worse than leaving the configuration blocked.
