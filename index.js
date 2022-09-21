const { Client, Embed } = require("guilded.js");
const {StringUtils} = require('turbocommons-ts');
const translate = require('@vitalets/google-translate-api');
const LanguageDetect = new (require('languagedetect'))();

//config
const prefix = '?'; // just an example, change to whatever you want
const bot_token = "your_token" // replace with your guilded acces token
const similaritypurcentage = 95; // if translation is 95% similar, don't send.

const client = new Client({ token: bot_token });


//onready
client.on('ready', () => {
    console.log(`Logged in as ${client.user.name}!`);
    client
});
const filter = new (require('bad-words'))({ placeHolder: "\\*" });

var q = [];

var runner

function starter() {
    runner = setInterval(() => {
        if (q.length > 0) {
            q[0]();
            q.shift();
        }
    }, 500);
}
starter();
client.on('messageCreated', message => {
    
    if (message.authorId == client.user.id) return;
    console.log("MSG")
    if (message) {
        const mess = message.content;
        if (!mess.startsWith(prefix)) {
            console.log("translation")

            const L = LanguageDetect.detect(mess, 1);
            console.log(L);
            if (L.length > 0 && L[0].length > 0 && L[0][0] == 'english') return;
            q.push(() => {
                translate(mess, { to: "en" }).then(res => {
                    if (res.from.language.iso == "en" || res.text.toLocaleLowerCase() == mess.toLocaleLowerCase()) return;
                    if (StringUtils.compareSimilarityPercent(res.text.toLocaleLowerCase(), mess.toLocaleLowerCase()) >= similaritypurcentage) return;
                    const word = filter.clean(res.text)
                    if (word.replace(/\\\*/g, "").trim().length < 1) return;
                    message.reply(word); // OUTPUT: You are amazing!
                }).catch(err => {
                    console.error(err);
                    message.reply("Transactional limit reached. Translate will be down for a minute"); // OUTPUT: You are amazing!
                    clearInterval(runner)
                    setTimeout(starter, 1000 * 60);
                });
            })

        } else {
            console.log("cmd")
            const args = mess.trim().split(/ +/g);
            const cmd = args[0].slice(prefix.length).toLowerCase(); // case INsensitive, without prefix
            args.shift();
            if (cmd == 'info') {
                return message.reply('Github repo : https://github.com/ri1ongithub/rtranslate/');
            }
            if (cmd == 'help') {
                return message.reply(
                    prefix + 'help: For this menu\n' +
                    prefix + 'info: For info about the creator\n' +
                    prefix + 'detect: Let me see if I can determine this strange set of data?\n'+
                    prefix + "[language code]: to have me translate your text into that language"
                );
            }
            if (cmd == 'detect') {
                const r = LanguageDetect.detect(args.join(' '), 5);
                var res = "\n "

                r.forEach(L => {
                    res += L[0] + " : " + Math.round(L[1] * 100.0) + "%\n"
                })
                
                const embed = new Embed()
                .setTitle('What language is "'+args.join(' ')+'"?')
                .setFooter("Let's see what I think it is")
                .setDescription("Let's see what I think it is \n " + res)
                .setAuthor(client.user.name)
                
                return message.reply(embed);
                
            }
            const output = mess.replace(prefix + cmd, '');
            translate(output, { to: cmd }).then(res => {
                message.reply(filter.clean(res.text)); // OUTPUT: You are amazing!
            }).catch(err => {
                console.error(err);
            });
        }
    }
});



client.login();
