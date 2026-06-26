# Adds ios/App/App/PrivacyInfo.xcprivacy to the "App" target's Copy Bundle
# Resources phase (idempotent). Run after `npx cap add ios` has created the
# project and the manifest has been copied into ios/App/App/.
require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.find { |t| t.name == 'App' }
abort('ERROR: "App" target not found') unless target

app_group = project.main_group.find_subpath('App', false)
abort('ERROR: "App" group not found') unless app_group

if app_group.files.any? { |f| f.display_name == 'PrivacyInfo.xcprivacy' }
  puts 'PrivacyInfo.xcprivacy already referenced in the project — nothing to do.'
else
  file_ref = app_group.new_file('PrivacyInfo.xcprivacy')
  target.resources_build_phase.add_file_reference(file_ref)
  project.save
  puts 'Added PrivacyInfo.xcprivacy to the App target.'
end
