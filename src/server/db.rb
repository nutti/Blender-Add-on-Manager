require 'openssl'
#OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE

require 'nokogiri'
require 'mechanize'
require 'uri'
require 'json'

CONFIG_FILE = 'config.json'

config = open(CONFIG_FILE) do |io|
    JSON.load(io)
end

agent = Mechanize.new

if config['proxy'] != nil then
    proxy_conf = config['proxy']
    agent.set_proxy(proxy_conf['server'], proxy_conf['port'], proxy_conf['username_enc'], proxy_conf['password'])
end

agent.agent.http.verify_mode = OpenSSL::SSL::VERIFY_NONE
agent.get('https://github.com/login') do |page|
    form = page.forms[0]
    github_conf = config['github']
    form.login = github_conf['username']
    form.password = github_conf['password']
    login_page = form.submit form.buttons.first
    #puts page.body
    
    params = URI.encode_www_form({
        q: 'bl_info',
        type: 'Code',
        ref: 'searchresults',
        p: 1})
    url = URI.parse("https://github.com/search?#{params}")
    agent.get(url) do |result|
        puts result.body
        doc = Nokogiri::HTML.parse(result, nil)
    end
    #h1_text = doc.xpath('//h1').text
end

