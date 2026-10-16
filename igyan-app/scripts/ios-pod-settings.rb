# Shared by the Podfile and the one-time updater for an existing Pods project.
# Only dependency targets are passed here; application diagnostics remain enabled.
def apply_igyan_pod_settings(project, minimum_ios_version = '17.0')
  minimum = Gem::Version.new(minimum_ios_version)
  project.targets.each do |target|
    target.build_configurations.each do |configuration|
      settings = configuration.build_settings
      deployment_target = settings['IPHONEOS_DEPLOYMENT_TARGET']
      if deployment_target && deployment_target.match?(/\A\d+(?:\.\d+)*\z/) && Gem::Version.new(deployment_target) < minimum
        settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum.to_s
      end
      if target.respond_to?(:product_type) && target.product_type == 'com.apple.product-type.library.static'
        settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'NO'
      end
      # Vendor sources include compatibility branches and generated empty files.
      # Keep these diagnostics out of the app's warning list without hiding errors.
      settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
      settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
      flags = settings['OTHER_LIBTOOLFLAGS']
      flags = flags.is_a?(Array) ? flags.dup : (flags ? [flags] : ['$(inherited)'])
      flags << '-no_warning_for_no_symbols' unless flags.include?('-no_warning_for_no_symbols')
      settings['OTHER_LIBTOOLFLAGS'] = flags
    end
    next unless target.name == 'hermes-engine'

    target.shell_script_build_phases.each do |phase|
      if phase.name.to_s.include?('[Hermes] Replace Hermes')
        phase.always_out_of_date = '1'
      end
    end
  end
end
