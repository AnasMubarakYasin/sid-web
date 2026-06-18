// Copyright 2021-2026, University of Colorado Boulder
const fs = require('fs');
const csvParser = require('csv-parser');
const filePath = process.argv[2];
/**
 * Read in the CSV export from the locales spreadsheet ("Final(dev)" format) and parse it into a localeJSON format.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const parseCSV = (filePath, callback)=>{
    const rows = [];
    fs.createReadStream(filePath).pipe(csvParser()).on('data', (row)=>{
        const values = Object.values(row);
        rows.push(values);
    }).on('end', ()=>{
        callback(null, rows);
    }).on('error', (error)=>{
        callback(error, null);
    });
};
parseCSV(filePath, (error, data)=>{
    if (error) {
        console.error('Error parsing CSV:', error);
    } else {
        const localeMainData = data.map((row)=>{
            let locale = row[1];
            let threeLetterLocale = row[2];
            let englishName = row[3];
            let localizedName = row[4];
            let direction = row[5];
            const fallback = row[6];
            locale = locale.trim();
            if (locale.length !== 2 && locale.length !== 5) {
                throw new Error(`Invalid locale: ${JSON.stringify(locale)}`);
            }
            if (!locale[0].match(/[a-z]/)) {
                throw new Error(`Invalid locale: ${locale}`);
            }
            if (!locale[1].match(/[a-z]/)) {
                throw new Error(`Invalid locale: ${locale}`);
            }
            if (locale.length === 5) {
                if (locale[2] !== '_') {
                    throw new Error(`Invalid locale: ${locale}`);
                }
                if (!locale[3].match(/[A-Z]/)) {
                    throw new Error(`Invalid locale: ${locale}`);
                }
                if (!locale[4].match(/[A-Z]/)) {
                    throw new Error(`Invalid locale: ${locale}`);
                }
            }
            threeLetterLocale = threeLetterLocale.trim(); // remove tab
            if (threeLetterLocale.length === 5 && locale === threeLetterLocale) {
                threeLetterLocale = null;
            } else if (threeLetterLocale.length === 0) {
                threeLetterLocale = null;
            }
            if (threeLetterLocale !== null) {
                if (threeLetterLocale.length !== 3) {
                    throw new Error(`Invalid three-letter locale: ${JSON.stringify(row)}`);
                }
                if (!threeLetterLocale.match(/^[a-z]{3}$/)) {
                    throw new Error(`Invalid three-letter locale: ${JSON.stringify(row)}`);
                }
            }
            englishName = englishName.trim().replace(/\u00A0/g, ' ');
            if (englishName.length < 1) {
                throw new Error(`Invalid English name: ${JSON.stringify(row)}`);
            }
            localizedName = localizedName.trim().replace(/\u00A0/g, ' ');
            if (localizedName.length < 1) {
                throw new Error(`Invalid localized name: ${JSON.stringify(row)}`);
            }
            // patch in
            if (locale === 'pt_ST') {
                direction = 'ltr';
            }
            if (direction !== 'ltr' && direction !== 'rtl') {
                throw new Error(`Invalid direction: ${JSON.stringify(row)}`);
            }
            const fallbackLocales = fallback.trim().split(',').map((x)=>x.trim()).filter((l)=>l !== 'en');
            const result = {
                locale: locale
            };
            if (threeLetterLocale) {
                result.locale3 = threeLetterLocale;
            }
            result.englishName = englishName;
            result.localizedName = localizedName;
            result.direction = direction;
            if (fallbackLocales.length) {
                result.fallbackLocales = fallbackLocales;
            }
            return result;
        });
        localeMainData.forEach((localeData)=>{
            localeData.fallbackLocales && localeData.fallbackLocales.forEach((fallbackLocale)=>{
                if (!localeMainData.find((x)=>x.locale === fallbackLocale)) {
                    throw new Error(`Invalid fallback locale: ${JSON.stringify(localeData)}`);
                }
            });
        });
        localeMainData.sort((a, b)=>{
            return a.locale.localeCompare(b.locale);
        });
        const localeInfo = {};
        localeMainData.forEach((localeData)=>{
            const locale = localeData.locale;
            delete localeData.locale;
            localeInfo[locale] = localeData;
        });
        const localeInfoString = JSON.stringify(localeInfo, null, 2);
        console.log(localeInfoString);
        // legacy localeInfo.js, that will be propagated to the other copies
        {
            const legacyLocaleInfoPrimaryFilename = '../chipper/js/data/localeInfo.js';
            if (!fs.existsSync(legacyLocaleInfoPrimaryFilename)) {
                throw new Error(`Expected to find ${legacyLocaleInfoPrimaryFilename}`);
            }
            const legacyLocaleInfoPrimary = fs.readFileSync(legacyLocaleInfoPrimaryFilename, 'utf8');
            const startIndex = legacyLocaleInfoPrimary.indexOf('const locales = {');
            const endIndex = legacyLocaleInfoPrimary.indexOf('module.exports = locales;', startIndex);
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('Failed to find localeInfo.js locales object');
            }
            let replacement = 'const locales = {\n';
            for(const locale in localeInfo){
                replacement += `  ${locale}: {\n`;
                replacement += `    name: '${localeInfo[locale].englishName.replace(/'/g, '\\\'')}',\n`;
                replacement += `    localizedName: '${localeInfo[locale].localizedName.replace(/'/g, '\\\'')}',\n`;
                replacement += `    direction: '${localeInfo[locale].direction}'\n`;
                replacement += '  },\n';
            }
            replacement += '};\n\n';
            const newLocaleInfoPrimary = legacyLocaleInfoPrimary.substring(0, startIndex) + replacement + legacyLocaleInfoPrimary.substring(endIndex);
            fs.writeFileSync(legacyLocaleInfoPrimaryFilename, newLocaleInfoPrimary, 'utf8');
        }
        // New babel localeData
        {
            const babelExtendedLocaleInfoFilename = '../babel/localeData.json';
            fs.writeFileSync(babelExtendedLocaleInfoFilename, localeInfoString);
        }
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2luaXRpYWwtcGFyc2UtbG9jYWxlcy1jc3YuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xuY29uc3QgY3N2UGFyc2VyID0gcmVxdWlyZSggJ2Nzdi1wYXJzZXInICk7XG5cbmNvbnN0IGZpbGVQYXRoID0gcHJvY2Vzcy5hcmd2WyAyIF07XG5cbi8qKlxuICogUmVhZCBpbiB0aGUgQ1NWIGV4cG9ydCBmcm9tIHRoZSBsb2NhbGVzIHNwcmVhZHNoZWV0IChcIkZpbmFsKGRldilcIiBmb3JtYXQpIGFuZCBwYXJzZSBpdCBpbnRvIGEgbG9jYWxlSlNPTiBmb3JtYXQuXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBwYXJzZUNTViA9ICggZmlsZVBhdGgsIGNhbGxiYWNrICkgPT4ge1xuICBjb25zdCByb3dzID0gW107XG5cbiAgZnMuY3JlYXRlUmVhZFN0cmVhbSggZmlsZVBhdGggKVxuICAgIC5waXBlKCBjc3ZQYXJzZXIoKSApXG4gICAgLm9uKCAnZGF0YScsIHJvdyA9PiB7XG4gICAgICBjb25zdCB2YWx1ZXMgPSBPYmplY3QudmFsdWVzKCByb3cgKTtcbiAgICAgIHJvd3MucHVzaCggdmFsdWVzICk7XG4gICAgfSApXG4gICAgLm9uKCAnZW5kJywgKCkgPT4ge1xuICAgICAgY2FsbGJhY2soIG51bGwsIHJvd3MgKTtcbiAgICB9IClcbiAgICAub24oICdlcnJvcicsIGVycm9yID0+IHtcbiAgICAgIGNhbGxiYWNrKCBlcnJvciwgbnVsbCApO1xuICAgIH0gKTtcbn07XG5cbnBhcnNlQ1NWKCBmaWxlUGF0aCwgKCBlcnJvciwgZGF0YSApID0+IHtcbiAgaWYgKCBlcnJvciApIHtcbiAgICBjb25zb2xlLmVycm9yKCAnRXJyb3IgcGFyc2luZyBDU1Y6JywgZXJyb3IgKTtcbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBsb2NhbGVNYWluRGF0YSA9IGRhdGEubWFwKCByb3cgPT4ge1xuICAgICAgbGV0IGxvY2FsZSA9IHJvd1sgMSBdO1xuICAgICAgbGV0IHRocmVlTGV0dGVyTG9jYWxlID0gcm93WyAyIF07XG4gICAgICBsZXQgZW5nbGlzaE5hbWUgPSByb3dbIDMgXTtcbiAgICAgIGxldCBsb2NhbGl6ZWROYW1lID0gcm93WyA0IF07XG4gICAgICBsZXQgZGlyZWN0aW9uID0gcm93WyA1IF07XG4gICAgICBjb25zdCBmYWxsYmFjayA9IHJvd1sgNiBdO1xuICAgICAgXG4gICAgICBsb2NhbGUgPSBsb2NhbGUudHJpbSgpO1xuXG4gICAgICBpZiAoIGxvY2FsZS5sZW5ndGggIT09IDIgJiYgbG9jYWxlLmxlbmd0aCAhPT0gNSApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgSW52YWxpZCBsb2NhbGU6ICR7SlNPTi5zdHJpbmdpZnkoIGxvY2FsZSApfWAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCAhbG9jYWxlWyAwIF0ubWF0Y2goIC9bYS16XS8gKSApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgSW52YWxpZCBsb2NhbGU6ICR7bG9jYWxlfWAgKTtcbiAgICAgIH1cbiAgICAgIGlmICggIWxvY2FsZVsgMSBdLm1hdGNoKCAvW2Etel0vICkgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgbG9jYWxlOiAke2xvY2FsZX1gICk7XG4gICAgICB9XG5cbiAgICAgIGlmICggbG9jYWxlLmxlbmd0aCA9PT0gNSApIHtcbiAgICAgICAgaWYgKCBsb2NhbGVbIDIgXSAhPT0gJ18nICkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgbG9jYWxlOiAke2xvY2FsZX1gICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAhbG9jYWxlWyAzIF0ubWF0Y2goIC9bQS1aXS8gKSApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBJbnZhbGlkIGxvY2FsZTogJHtsb2NhbGV9YCApO1xuICAgICAgICB9XG4gICAgICAgIGlmICggIWxvY2FsZVsgNCBdLm1hdGNoKCAvW0EtWl0vICkgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgSW52YWxpZCBsb2NhbGU6ICR7bG9jYWxlfWAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aHJlZUxldHRlckxvY2FsZSA9IHRocmVlTGV0dGVyTG9jYWxlLnRyaW0oKTsgLy8gcmVtb3ZlIHRhYlxuXG4gICAgICBpZiAoIHRocmVlTGV0dGVyTG9jYWxlLmxlbmd0aCA9PT0gNSAmJiBsb2NhbGUgPT09IHRocmVlTGV0dGVyTG9jYWxlICkge1xuICAgICAgICB0aHJlZUxldHRlckxvY2FsZSA9IG51bGw7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICggdGhyZWVMZXR0ZXJMb2NhbGUubGVuZ3RoID09PSAwICkge1xuICAgICAgICB0aHJlZUxldHRlckxvY2FsZSA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmICggdGhyZWVMZXR0ZXJMb2NhbGUgIT09IG51bGwgKSB7XG4gICAgICAgIGlmICggdGhyZWVMZXR0ZXJMb2NhbGUubGVuZ3RoICE9PSAzICkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgdGhyZWUtbGV0dGVyIGxvY2FsZTogJHtKU09OLnN0cmluZ2lmeSggcm93ICl9YCApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCAhdGhyZWVMZXR0ZXJMb2NhbGUubWF0Y2goIC9eW2Etel17M30kLyApICkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgdGhyZWUtbGV0dGVyIGxvY2FsZTogJHtKU09OLnN0cmluZ2lmeSggcm93ICl9YCApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVuZ2xpc2hOYW1lID0gZW5nbGlzaE5hbWUudHJpbSgpLnJlcGxhY2UoIC9cXHUwMEEwL2csICcgJyApO1xuXG4gICAgICBpZiAoIGVuZ2xpc2hOYW1lLmxlbmd0aCA8IDEgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgRW5nbGlzaCBuYW1lOiAke0pTT04uc3RyaW5naWZ5KCByb3cgKX1gICk7XG4gICAgICB9XG5cbiAgICAgIGxvY2FsaXplZE5hbWUgPSBsb2NhbGl6ZWROYW1lLnRyaW0oKS5yZXBsYWNlKCAvXFx1MDBBMC9nLCAnICcgKTtcblxuICAgICAgaWYgKCBsb2NhbGl6ZWROYW1lLmxlbmd0aCA8IDEgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgbG9jYWxpemVkIG5hbWU6ICR7SlNPTi5zdHJpbmdpZnkoIHJvdyApfWAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gcGF0Y2ggaW5cbiAgICAgIGlmICggbG9jYWxlID09PSAncHRfU1QnICkge1xuICAgICAgICBkaXJlY3Rpb24gPSAnbHRyJztcbiAgICAgIH1cblxuICAgICAgaWYgKCBkaXJlY3Rpb24gIT09ICdsdHInICYmIGRpcmVjdGlvbiAhPT0gJ3J0bCcgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEludmFsaWQgZGlyZWN0aW9uOiAke0pTT04uc3RyaW5naWZ5KCByb3cgKX1gICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZhbGxiYWNrTG9jYWxlcyA9IGZhbGxiYWNrLnRyaW0oKS5zcGxpdCggJywnICkubWFwKCB4ID0+IHgudHJpbSgpICkuZmlsdGVyKCBsID0+IGwgIT09ICdlbicgKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICBsb2NhbGU6IGxvY2FsZVxuICAgICAgfTtcblxuICAgICAgaWYgKCB0aHJlZUxldHRlckxvY2FsZSApIHtcbiAgICAgICAgcmVzdWx0LmxvY2FsZTMgPSB0aHJlZUxldHRlckxvY2FsZTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LmVuZ2xpc2hOYW1lID0gZW5nbGlzaE5hbWU7XG4gICAgICByZXN1bHQubG9jYWxpemVkTmFtZSA9IGxvY2FsaXplZE5hbWU7XG4gICAgICByZXN1bHQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICBpZiAoIGZhbGxiYWNrTG9jYWxlcy5sZW5ndGggKSB7XG4gICAgICAgIHJlc3VsdC5mYWxsYmFja0xvY2FsZXMgPSBmYWxsYmFja0xvY2FsZXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSApO1xuXG4gICAgbG9jYWxlTWFpbkRhdGEuZm9yRWFjaCggbG9jYWxlRGF0YSA9PiB7XG4gICAgICBsb2NhbGVEYXRhLmZhbGxiYWNrTG9jYWxlcyAmJiBsb2NhbGVEYXRhLmZhbGxiYWNrTG9jYWxlcy5mb3JFYWNoKCBmYWxsYmFja0xvY2FsZSA9PiB7XG4gICAgICAgIGlmICggIWxvY2FsZU1haW5EYXRhLmZpbmQoIHggPT4geC5sb2NhbGUgPT09IGZhbGxiYWNrTG9jYWxlICkgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgSW52YWxpZCBmYWxsYmFjayBsb2NhbGU6ICR7SlNPTi5zdHJpbmdpZnkoIGxvY2FsZURhdGEgKX1gICk7XG4gICAgICAgIH1cbiAgICAgIH0gKTtcbiAgICB9ICk7XG5cbiAgICBsb2NhbGVNYWluRGF0YS5zb3J0KCAoIGEsIGIgKSA9PiB7XG4gICAgICByZXR1cm4gYS5sb2NhbGUubG9jYWxlQ29tcGFyZSggYi5sb2NhbGUgKTtcbiAgICB9ICk7XG5cbiAgICBjb25zdCBsb2NhbGVJbmZvID0ge307XG5cbiAgICBsb2NhbGVNYWluRGF0YS5mb3JFYWNoKCBsb2NhbGVEYXRhID0+IHtcbiAgICAgIGNvbnN0IGxvY2FsZSA9IGxvY2FsZURhdGEubG9jYWxlO1xuICAgICAgZGVsZXRlIGxvY2FsZURhdGEubG9jYWxlO1xuICAgICAgbG9jYWxlSW5mb1sgbG9jYWxlIF0gPSBsb2NhbGVEYXRhO1xuICAgIH0gKTtcblxuICAgIGNvbnN0IGxvY2FsZUluZm9TdHJpbmcgPSBKU09OLnN0cmluZ2lmeSggbG9jYWxlSW5mbywgbnVsbCwgMiApO1xuICAgIGNvbnNvbGUubG9nKCBsb2NhbGVJbmZvU3RyaW5nICk7XG5cbiAgICAvLyBsZWdhY3kgbG9jYWxlSW5mby5qcywgdGhhdCB3aWxsIGJlIHByb3BhZ2F0ZWQgdG8gdGhlIG90aGVyIGNvcGllc1xuICAgIHtcbiAgICAgIGNvbnN0IGxlZ2FjeUxvY2FsZUluZm9QcmltYXJ5RmlsZW5hbWUgPSAnLi4vY2hpcHBlci9qcy9kYXRhL2xvY2FsZUluZm8uanMnO1xuXG4gICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBsZWdhY3lMb2NhbGVJbmZvUHJpbWFyeUZpbGVuYW1lICkgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEV4cGVjdGVkIHRvIGZpbmQgJHtsZWdhY3lMb2NhbGVJbmZvUHJpbWFyeUZpbGVuYW1lfWAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGVnYWN5TG9jYWxlSW5mb1ByaW1hcnkgPSBmcy5yZWFkRmlsZVN5bmMoIGxlZ2FjeUxvY2FsZUluZm9QcmltYXJ5RmlsZW5hbWUsICd1dGY4JyApO1xuXG4gICAgICBjb25zdCBzdGFydEluZGV4ID0gbGVnYWN5TG9jYWxlSW5mb1ByaW1hcnkuaW5kZXhPZiggJ2NvbnN0IGxvY2FsZXMgPSB7JyApO1xuICAgICAgY29uc3QgZW5kSW5kZXggPSBsZWdhY3lMb2NhbGVJbmZvUHJpbWFyeS5pbmRleE9mKCAnbW9kdWxlLmV4cG9ydHMgPSBsb2NhbGVzOycsIHN0YXJ0SW5kZXggKTtcblxuICAgICAgaWYgKCBzdGFydEluZGV4ID09PSAtMSB8fCBlbmRJbmRleCA9PT0gLTEgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ0ZhaWxlZCB0byBmaW5kIGxvY2FsZUluZm8uanMgbG9jYWxlcyBvYmplY3QnICk7XG4gICAgICB9XG5cbiAgICAgIGxldCByZXBsYWNlbWVudCA9ICdjb25zdCBsb2NhbGVzID0ge1xcbic7XG5cbiAgICAgIGZvciAoIGNvbnN0IGxvY2FsZSBpbiBsb2NhbGVJbmZvICkge1xuICAgICAgICByZXBsYWNlbWVudCArPSBgICAke2xvY2FsZX06IHtcXG5gO1xuICAgICAgICByZXBsYWNlbWVudCArPSBgICAgIG5hbWU6ICcke2xvY2FsZUluZm9bIGxvY2FsZSBdLmVuZ2xpc2hOYW1lLnJlcGxhY2UoIC8nL2csICdcXFxcXFwnJyApfScsXFxuYDtcbiAgICAgICAgcmVwbGFjZW1lbnQgKz0gYCAgICBsb2NhbGl6ZWROYW1lOiAnJHtsb2NhbGVJbmZvWyBsb2NhbGUgXS5sb2NhbGl6ZWROYW1lLnJlcGxhY2UoIC8nL2csICdcXFxcXFwnJyApfScsXFxuYDtcbiAgICAgICAgcmVwbGFjZW1lbnQgKz0gYCAgICBkaXJlY3Rpb246ICcke2xvY2FsZUluZm9bIGxvY2FsZSBdLmRpcmVjdGlvbn0nXFxuYDtcbiAgICAgICAgcmVwbGFjZW1lbnQgKz0gJyAgfSxcXG4nO1xuICAgICAgfVxuXG4gICAgICByZXBsYWNlbWVudCArPSAnfTtcXG5cXG4nO1xuXG4gICAgICBjb25zdCBuZXdMb2NhbGVJbmZvUHJpbWFyeSA9IGxlZ2FjeUxvY2FsZUluZm9QcmltYXJ5LnN1YnN0cmluZyggMCwgc3RhcnRJbmRleCApICsgcmVwbGFjZW1lbnQgKyBsZWdhY3lMb2NhbGVJbmZvUHJpbWFyeS5zdWJzdHJpbmcoIGVuZEluZGV4ICk7XG5cbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGxlZ2FjeUxvY2FsZUluZm9QcmltYXJ5RmlsZW5hbWUsIG5ld0xvY2FsZUluZm9QcmltYXJ5LCAndXRmOCcgKTtcbiAgICB9XG5cbiAgICAvLyBOZXcgYmFiZWwgbG9jYWxlRGF0YVxuICAgIHtcbiAgICAgIGNvbnN0IGJhYmVsRXh0ZW5kZWRMb2NhbGVJbmZvRmlsZW5hbWUgPSAnLi4vYmFiZWwvbG9jYWxlRGF0YS5qc29uJztcblxuICAgICAgZnMud3JpdGVGaWxlU3luYyggYmFiZWxFeHRlbmRlZExvY2FsZUluZm9GaWxlbmFtZSwgbG9jYWxlSW5mb1N0cmluZyApO1xuICAgIH1cbiAgfVxufSApOyJdLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJjc3ZQYXJzZXIiLCJmaWxlUGF0aCIsInByb2Nlc3MiLCJhcmd2IiwicGFyc2VDU1YiLCJjYWxsYmFjayIsInJvd3MiLCJjcmVhdGVSZWFkU3RyZWFtIiwicGlwZSIsIm9uIiwicm93IiwidmFsdWVzIiwiT2JqZWN0IiwicHVzaCIsImVycm9yIiwiZGF0YSIsImNvbnNvbGUiLCJsb2NhbGVNYWluRGF0YSIsIm1hcCIsImxvY2FsZSIsInRocmVlTGV0dGVyTG9jYWxlIiwiZW5nbGlzaE5hbWUiLCJsb2NhbGl6ZWROYW1lIiwiZGlyZWN0aW9uIiwiZmFsbGJhY2siLCJ0cmltIiwibGVuZ3RoIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwibWF0Y2giLCJyZXBsYWNlIiwiZmFsbGJhY2tMb2NhbGVzIiwic3BsaXQiLCJ4IiwiZmlsdGVyIiwibCIsInJlc3VsdCIsImxvY2FsZTMiLCJmb3JFYWNoIiwibG9jYWxlRGF0YSIsImZhbGxiYWNrTG9jYWxlIiwiZmluZCIsInNvcnQiLCJhIiwiYiIsImxvY2FsZUNvbXBhcmUiLCJsb2NhbGVJbmZvIiwibG9jYWxlSW5mb1N0cmluZyIsImxvZyIsImxlZ2FjeUxvY2FsZUluZm9QcmltYXJ5RmlsZW5hbWUiLCJleGlzdHNTeW5jIiwibGVnYWN5TG9jYWxlSW5mb1ByaW1hcnkiLCJyZWFkRmlsZVN5bmMiLCJzdGFydEluZGV4IiwiaW5kZXhPZiIsImVuZEluZGV4IiwicmVwbGFjZW1lbnQiLCJuZXdMb2NhbGVJbmZvUHJpbWFyeSIsInN1YnN0cmluZyIsIndyaXRlRmlsZVN5bmMiLCJiYWJlbEV4dGVuZGVkTG9jYWxlSW5mb0ZpbGVuYW1lIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQsTUFBTUEsS0FBS0MsUUFBUztBQUNwQixNQUFNQyxZQUFZRCxRQUFTO0FBRTNCLE1BQU1FLFdBQVdDLFFBQVFDLElBQUksQ0FB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