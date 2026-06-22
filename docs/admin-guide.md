# Colink.nz Admin Guide

## Admin Area

The admin interface lives under:

```text
/admin
/admin/dashboard
```

Admin pages must use separate layout, navigation, and permission checks from the
member-facing website.

## Admin Menu

| Menu | Features |
| --- | --- |
| Dashboard | Members, posts, reports, ads, visitors |
| Members | Search, suspend, restore, change role, check verification |
| Posts | View all, hide, delete, pin, move category |
| Comments | Delete comments and review reported comments |
| Reports | Process reports and identify repeat offenders |
| Ads | Upload banners, set position, schedule, track clicks |
| Categories | Add, hide, reorder, and edit board categories |
| Business Verification | Approve or reject business member applications |
| Notices | Write notices and pin important posts |
| Security Logs | Login failures, admin activity, suspicious behavior |
| Site Settings | Logo, color, main banner, terms, privacy policy |

## Required Logs

Every admin mutation should create an `admin_logs` record.

```text
admin_id
action
target_type
target_id
ip_address
user_agent
metadata
created_at
```

## High-Risk Actions

These actions require extra care and should be easy to audit:

- Delete or hide a post
- Suspend or restore a user
- Change a user role
- Edit ad placement
- Approve or reject business verification
- Change site settings
- Create or modify another admin account
