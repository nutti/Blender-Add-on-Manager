require 'FileUtils'



target = ARGV[0]
if target == nil
    exit 1
end

workdir = target + '_rmdeepfile_tmp'

FileUtils.mkdir_p(workdir)

list = Dir.glob target + '/**/*'

sorted = list.sort{|a, b| b.size <=> a.size}

sorted.each { |elm|
    FileUtils.mv(elm, workdir)
}
