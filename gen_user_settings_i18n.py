
import json

page_settings = [
  { "key": "pages.dashboard.enabled", "name": "Dashboard", "description": "Access to main dashboard", "name_ku": "داشبۆرد", "desc_ku": "تێرورکردن بۆ داشبۆردی سەرەکی" },
  { "key": "pages.invoices.enabled", "name": "Invoices", "description": "Create and view invoices", "name_ku": "پسوڵەکان", "desc_ku": "دروستکردن و بینینی پسوڵەکان" },
  { "key": "pages.accounting.enabled", "name": "Accounting", "description": "Financial management and expense tracking", "name_ku": "ژمێریاری", "desc_ku": "بەڕێوەبردنی دارایی و شوێنکەوتنی خەرجییەکان" },
  { "key": "pages.expenses.enabled", "name": "Expenses", "description": "Manage business expenses", "name_ku": "خەرجییەکان", "desc_ku": "بەڕێوەبردنی خەرجییەکانی کاروبار" },
  { "key": "pages.debt.enabled", "name": "Debt Management", "description": "Track and manage debts", "name_ku": "بەڕێوەبردنی قەرز", "desc_ku": "شوێنکەوتن و بەڕێوەبردنی قەرزەکان" },
  { "key": "pages.services.enabled", "name": "Services", "description": "Manage cleaning services", "name_ku": "خزمەتگوزارییەکان", "desc_ku": "بەڕێوەبردنی خزمەتگوزارییەکانی پاککردنەوە" },
  { "key": "pages.team.enabled", "name": "Team", "description": "View team members", "name_ku": "تیم", "desc_ku": "بینینی ئەندامانی تیم" },
  { "key": "pages.tracking.enabled", "name": "Live Tracking", "description": "Location tracking", "name_ku": "شوێنکەوتنی ڕاستەوخۆ", "desc_ku": "شوێنکەوتنی شوێن" },
  { "key": "pages.analytics.enabled", "name": "Analytics", "description": "Performance analytics", "name_ku": "شیکردنەوە", "desc_ku": "شیکردنەوەی ئەداکاری" },
  { "key": "pages.customers.enabled", "name": "Customers", "description": "View and manage customers", "name_ku": "کڕیاران", "desc_ku": "بینین و بەڕێوەبردنی کڕیاران" },
  { "key": "pages.bookings.enabled", "name": "Bookings", "description": "Manage customer bookings", "name_ku": "حجزکردنەکان", "desc_ku": "بەڕێوەبردنی حجزکردنەکانی کڕیار" },
  { "key": "pages.assign-bookings.enabled", "name": "Assign Bookings", "description": "Assign bookings to team members", "name_ku": "دیاریکردنی حجزکردن", "desc_ku": "دیاریکردنی حجزکردنەکان بۆ ئەندامانی تیم" },
  { "key": "pages.customer-locations.enabled", "name": "Customer Locations", "description": "Manage customer addresses and locations", "name_ku": "شوێنی کڕیاران", "desc_ku": "بەڕێوەبردنی ناونیشان و شوێنەکانی کڕیاران" },
  { "key": "pages.equipment.enabled", "name": "Equipment", "description": "Manage equipment inventory", "name_ku": "کەلوپەلەکان", "desc_ku": "بەڕێوەبردنی کۆگای کەلوپەلەکان" },
  { "key": "pages.admin.enabled", "name": "Admin Panel", "description": "User management", "name_ku": "پانێڵی بەڕێوەبەر", "desc_ku": "بەڕێوەبردنی بەکارهێنەران" },
  { "key": "pages.admin-permissions.enabled", "name": "Admin Permissions", "description": "Advanced permission management", "name_ku": "دەسەڵاتەکانی بەڕێوەبەر", "desc_ku": "بەڕێوەبردنی پێشکەوتووی دەسەڵاتەکان" },
  { "key": "pages.user-settings.enabled", "name": "User Settings", "description": "User-specific settings configuration", "name_ku": "ڕێکخستنی بەکارهێنەر", "desc_ku": "ڕێکخستنی تایبەت بە بەکارهێنەر" },
  { "key": "pages.settings.enabled", "name": "Settings", "description": "System configuration", "name_ku": "ڕێکخستنەکان", "desc_ku": "ڕێکخستنی سیستەم" },
  { "key": "pages.header-footer.enabled", "name": "Header/Footer Management", "description": "Manage invoice headers and footers", "name_ku": "بەڕێوەبردنی سەرپەڕ و ژێرپەڕ", "desc_ku": "بەڕێوەبردنی سەرپەڕ و ژێرپەڕی پسوڵەکان" },
  { "key": "pages.security-dashboard.enabled", "name": "Security Dashboard", "description": "System security monitoring", "name_ku": "داشبۆردی پاراستن", "desc_ku": "چاودێریکردنی پاراستنی سیستەم" },
  { "key": "pages.about-developer.enabled", "name": "About Developer", "description": "Developer information and contact", "name_ku": "دەربارەی گەشەپێدەر", "desc_ku": "زانیاری دەربارەی گەشەپێدەر و پەیوەندی" },
]

comp_settings = [
  { "key": "components.invoice_form.enabled", "name": "Invoice Creation", "description": "Create new invoices", "name_ku": "دروستکردنی پسوڵە", "desc_ku": "دروستکردنی پسوڵەی نوێ" },
  { "key": "components.invoice_edit.enabled", "name": "Invoice Editing", "description": "Edit existing invoices", "name_ku": "دەستکاریکردنی پسوڵە", "desc_ku": "دەستکاریکردنی پسوڵەکانی ئێستا" },
  { "key": "components.invoice_delete.enabled", "name": "Invoice Deletion", "description": "Delete invoices", "name_ku": "سڕینەوەی پسوڵە", "desc_ku": "سڕینەوەی پسوڵەکان" },
  { "key": "components.expense_management.enabled", "name": "Expense Management", "description": "Record and manage business expenses", "name_ku": "بەڕێوەبردنی خەرجییەکان", "desc_ku": "تۆمارکردن و بەڕێوەبردنی خەرجییەکانی کاروبار" },
  { "key": "components.debt_management.enabled", "name": "Debt Management", "description": "Track and manage debts", "name_ku": "بەڕێوەبردنی قەرز", "desc_ku": "شوێنکەوتن و بەڕێوەبردنی قەرزەکان" },
  { "key": "components.financial_reports.enabled", "name": "Financial Reports", "description": "Generate and export financial reports", "name_ku": "ڕاپۆرتە داراییەکان", "desc_ku": "دروستکردن و هەناردەکردنی ڕاپۆرتە داراییەکان" },
  { "key": "components.team_management.enabled", "name": "Team Management", "description": "Add/edit team members", "name_ku": "بەڕێوەبردنی تیم", "desc_ku": "زیادکردن/دەستکاریکردنی ئەندامانی تیم" },
  { "key": "components.team_delete.enabled", "name": "Team Member Deletion", "description": "Remove team members", "name_ku": "سڕینەوەی ئەندامی تیم", "desc_ku": "لابردنی ئەندامانی تیم" },
  { "key": "components.location_tracking.enabled", "name": "Location Tracking", "description": "Share location data", "name_ku": "شوێنکەوتنی شوێن", "desc_ku": "هاوبەشکردنی داتاکانی شوێن" },
  { "key": "components.location_history.enabled", "name": "Location History", "description": "View location history", "name_ku": "مێژووی شوێن", "desc_ku": "بینینی مێژووی شوێن" },
  { "key": "components.analytics_export.enabled", "name": "Analytics Export", "description": "Export reports", "name_ku": "هەناردەی شیکاری", "desc_ku": "هەناردەکردنی ڕاپۆرتەکان" },
  { "key": "components.service_management.enabled", "name": "Service Management", "description": "Add/edit/delete services", "name_ku": "بەڕێوەبردنی خزمەتگوزارییەکان", "desc_ku": "زیادکردن/دەستکاریکردن/سڕینەوەی خزمەتگوزارییەکان" },
  { "key": "components.booking_assignment.enabled", "name": "Booking Assignment", "description": "Assign bookings to cleaners", "name_ku": "دیاریکردنی حجزکردن", "desc_ku": "دیاریکردنی حجزکردنەکان بۆ پاککەرەوەکان" },
  { "key": "components.booking_status_update.enabled", "name": "Booking Status Update", "description": "Update booking status", "name_ku": "نوێکردنەوەی دۆخی حجزکردن", "desc_ku": "نوێکردنەوەی دۆخی حجزکردنەکان" },
  { "key": "components.customer_management.enabled", "name": "Customer Management", "description": "Manage customer information", "name_ku": "بەڕێوەبردنی کڕیاران", "desc_ku": "بەڕێوەبردنی زانیارییەکانی کڕیار" },
  { "key": "components.equipment_management.enabled", "name": "Equipment Management", "description": "Manage equipment inventory", "name_ku": "بەڕێوەبردنی کەلوپەلەکان", "desc_ku": "بەڕێوەبردنی کۆگای کەلوپەلەکان" },
  { "key": "components.notifications.enabled", "name": "Notifications", "description": "Receive and view notifications", "name_ku": "ئاگادارکردنەوەکان", "desc_ku": "وەرگرتن و بینینی ئاگادارکردنەوەکان" },
  { "key": "components.notification_send.enabled", "name": "Send Notifications", "description": "Send notifications to users", "name_ku": "ناردنی ئاگادارکردنەوەکان", "desc_ku": "ناردنی ئاگادارکردنەوەکان بۆ بەکارهێنەران" },
  { "key": "components.settings_modify.enabled", "name": "Modify Settings", "description": "Change system settings", "name_ku": "دەستکاریکردنی ڕێکخستنەکان", "desc_ku": "گۆڕینی ڕێکخستنەکانی سیستەم" },
  { "key": "components.pdf_export.enabled", "name": "PDF Export", "description": "Export documents to PDF", "name_ku": "هەناردەی PDF", "desc_ku": "هەناردەکردنی بەڵگەنامەکان بۆ PDF" },
  { "key": "components.mobile_menu.enabled", "name": "Mobile Menu", "description": "Access mobile navigation menu", "name_ku": "مێنیۆی مۆبایل", "desc_ku": "دەستگەیشتن بە مێنیۆی ڕێدۆزی مۆبایل" },
]

def add_to_json(file_path, settings, is_kurdish):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "userSettings" not in data:
        data["userSettings"] = {}
    
    for s in settings:
        key_parts = s["key"].split('.')
        base_key = key_parts[1] # e.g. dashboard
        category = key_parts[0] # e.g. pages
        
        if category not in data["userSettings"]:
            data["userSettings"][category] = {}
        
        if base_key not in data["userSettings"][category]:
            data["userSettings"][category][base_key] = {}
        
        data["userSettings"][category][base_key]["name"] = s["name_ku"] if is_kurdish else s["name"]
        data["userSettings"][category][base_key]["description"] = s["desc_ku"] if is_kurdish else s["description"]

    # Common labels
    if is_kurdish:
        data["userSettings"]["title"] = "ڕێکخستنی تایبەت بە بەکارهێنەر"
        data["userSettings"]["subtitle"] = "کۆنترۆڵکردنی لاپەڕەکان و تایبەتمەندییەکان کە هەر بەکارهێنەرێک دەستی پێ بگات"
        data["userSettings"]["teamMembersCount"] = "{{count}} ئەندامی تیم"
        data["userSettings"]["selectUser"] = "بەکارهێنەر هەڵبژێرە"
        data["userSettings"]["selectUserPlaceholder"] = "ئەندامێکی تیم هەڵبژێرە بۆ بەڕێوەبردنی ڕێکخستنەکانی..."
        data["userSettings"]["settingsFor"] = "ڕێکخستنەکان بۆ: {{name}}"
        data["userSettings"]["tabs"] = { "pages": "دەستگەیشتن بە لاپەڕەکان", "components": "دەستگەیشتن بە تایبەتمەندییەکان" }
        data["userSettings"]["pageAccessControl"] = "کۆنترۆڵکردنی دەستگەیشتن بە لاپەڕەکان"
        data["userSettings"]["featureAccessControl"] = "کۆنترۆڵکردنی دەستگەیشتن بە تایبەتمەندییەکان"
        data["userSettings"]["enabledCount"] = "{{enabled}} لە {{total}} چالاککراوە"
        data["userSettings"]["enabled"] = "چالاککراوە"
        data["userSettings"]["disabled"] = "ناچالاککراوە"
        data["userSettings"]["noUserSelected"] = "هیچ بەکارهێنەرێک هەڵنەبژێردراوە"
        data["userSettings"]["noUserSelectedDesc"] = "ئەندامێکی تیم لە لیستی سەرەوە هەڵبژێرە بۆ ڕێکخستنی دەسەڵاتەکانی."
        data["userSettings"]["controlList"] = {
            "title": "دەتوانی ئەمانە کۆنترۆڵ بکەیت:",
            "pages": "کام لاپەڕە ببینێت",
            "features": "کام تایبەتمەندی بەکاربهێنێت",
            "permissions": "دەسەڵاتە گشتییەکانی سیستەم"
        }
        data["userSettings"]["permissionSystem"] = "سیستەمی دەسەڵاتەکان"
        data["userSettings"]["permissionNotes"] = [
            "بەڕێوەبەرەکان (Admins) هەمیشە دەسەڵاتی تەواویان هەیە بێ گوێدانە ئەم ڕێکخستنانە",
            "سەرپەرشتیاران و بەکارهێنەرانی ئاسایی بەپێی ئەو ڕێکخستنانەی لێرە دەیکەیت سنووردار دەکرێن",
            "لاپەڕە ناچالاککراوەکان پەیامی 'ڕێگری دەستگەیشتن' نیشانی بەکارهێنەر دەدەن",
            "تایبەتمەندییە ناچالاککراوەکان لە ڕووکاری بەکارهێنەردا دەشاردرێنەوە"
        ]
        data["userSettings"]["updateSuccess"] = "ڕێکخستنی بەکارهێنەر بە سەرکەوتوویی نوێکرایەوە"
        data["userSettings"]["updateError"] = "هەڵە لە نوێکردنەوەی ڕێکخستنەکان"
    else:
        data["userSettings"]["title"] = "User-Specific Settings"
        data["userSettings"]["subtitle"] = "Control which pages and features individual users can access"
        data["userSettings"]["teamMembersCount"] = "{{count}} team members"
        data["userSettings"]["selectUser"] = "Select User"
        data["userSettings"]["selectUserPlaceholder"] = "Choose a team member to manage settings for..."
        data["userSettings"]["settingsFor"] = "Settings for: {{name}}"
        data["userSettings"]["tabs"] = { "pages": "Page Access", "components": "Feature Access" }
        data["userSettings"]["pageAccessControl"] = "Page Access Control"
        data["userSettings"]["featureAccessControl"] = "Feature Access Control"
        data["userSettings"]["enabledCount"] = "{{enabled}} of {{total}} enabled"
        data["userSettings"]["enabled"] = "Enabled"
        data["userSettings"]["disabled"] = "Disabled"
        data["userSettings"]["noUserSelected"] = "No User Selected"
        data["userSettings"]["noUserSelectedDesc"] = "Choose a team member from the dropdown above to configure their access permissions."
        data["userSettings"]["controlList"] = {
            "title": "You can control:",
            "pages": "Which pages they can access",
            "features": "Which features they can use",
            "permissions": "Their overall system permissions"
        }
        data["userSettings"]["permissionSystem"] = "Permission System"
        data["userSettings"]["permissionNotes"] = [
            "Admins always have full access regardless of these settings",
            "Supervisors and Regular users are restricted based on the settings you configure here",
            "Disabled pages will show an access denied message to the user",
            "Disabled features will be hidden from the user interface"
        ]
        data["userSettings"]["updateSuccess"] = "User setting updated successfully"
        data["userSettings"]["updateError"] = "Error updating settings"

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_path = r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\client\src\locales\en.json'
ku_path = r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\client\src\locales\ku.json'

add_to_json(en_path, page_settings, False)
add_to_json(en_path, comp_settings, False)
add_to_json(ku_path, page_settings, True)
add_to_json(ku_path, comp_settings, True)

print("Translation files updated with userSettings.")
