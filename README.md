# PHP-Live-RegEx
A shameless copy of PHPLiveRegex.com

# Live Regex - A Live Regular Expression Tester for PHP

This is a PHP regular expression testing tool that allows you to test PHP's regex functions in real-time. It's designed to mimic the functionality shown in the PHP Live Regex website.

## Features

- Test regular expressions using PHP's regex functions:
  - preg_match
  - preg_match_all
  - preg_replace
  - preg_grep
  - preg_split
- Real-time results as you type
- Visual display of array results similar to PHP's var_dump
- Permalink functionality to share your regex tests
- Clear form with a single click

## How to Use

1. Enter your regular expression in the Regex field (without delimiters)
2. Add any pattern modifiers in the options field (e.g., 'i' for case-insensitive)
3. If using preg_replace, enter your replacement pattern
4. Enter your test strings in the text area (one per line)
5. Select the PHP function you want to test with
6. View the results and PHP code in real-time

## Running Locally

### With PHP

For the best experience, run this application with PHP:

```bash
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your web browser.

### Without PHP

The application can also run with client-side JavaScript only. Simply open `index.html` in your web browser.

## Technical Details

- Client-side regex testing is done using JavaScript's RegExp
- If PHP is available, server-side processing is used for more accurate results
- The application uses fetch API for AJAX requests
- Results are formatted to match PHP's array output format

## License

MIT

## Credits

This project was inspired by PHP Live Regex.
