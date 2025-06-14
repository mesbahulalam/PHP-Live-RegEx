document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const regexPattern = document.getElementById('regex-pattern');
    const regexOptions = document.getElementById('regex-options');
    const replacementPattern = document.getElementById('replacement-pattern');
    const testStrings = document.getElementById('test-strings');
    const phpCode = document.getElementById('php-code');
    const resultsDiv = document.getElementById('results');
    const functionButtons = document.querySelectorAll('.regex-functions button');
    const makePermalinkBtn = document.getElementById('make-permalink');
    const clearFormBtn = document.getElementById('clear-form');
    
    // Current active function
    let activeFunction = 'preg_match';
    
    // Check if server processing is available
    let useServerProcessing = false;
    
    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Function to update results in real-time
    const updateResults = debounce(function() {
        const pattern = regexPattern.value;
        const options = regexOptions.value;
        const replacement = replacementPattern.value;
        const strings = testStrings.value.split('\n');
        
        // Update PHP code display based on active function
        updatePhpCode(pattern, options, replacement);
        
        // Try to use server processing, fall back to client-side
        if (useServerProcessing) {
            processRegexServer(pattern, options, replacement, strings);
        } else {
            processRegex(pattern, options, replacement, strings);
        }
    }, 300);
    
    // Update PHP code display based on active function
    function updatePhpCode(pattern, options, replacement) {
        let code = '';
        
        switch(activeFunction) {
            case 'preg_match':
                code = `preg_match('/${pattern}/${options}', $input_line, $output_array);`;
                break;
            case 'preg_match_all':
                code = `preg_match_all('/${pattern}/${options}', $input_line, $output_array);`;
                break;
            case 'preg_replace':
                code = `preg_replace('/${pattern}/${options}', '${replacement}', $input_line);`;
                break;
            case 'preg_grep':
                code = `preg_grep('/${pattern}/${options}', $input_lines);`;
                break;
            case 'preg_split':
                code = `preg_split('/${pattern}/${options}', $input_line);`;
                break;
        }
        
        phpCode.textContent = code;
    }
    
    // Process regex on input strings and display results
    function processRegex(pattern, options, replacement, strings) {
        // Clear previous results
        resultsDiv.innerHTML = '';

        if (!pattern) return;

        try {
            // Create regex object with pattern and options
            const regex = new RegExp(pattern, options);

            // For preg_match_all: process all strings together
            if (activeFunction === 'preg_match_all') {
                const allText = strings.filter(s => s.trim() !== '').join('\n');
                const resultDiv = document.createElement('div');
                resultDiv.className = 'array-result';
                processPregMatchAll(regex, allText, resultDiv);
                resultsDiv.appendChild(resultDiv);
                return;
            }

            // Process each string based on active function
            strings.forEach((string, index) => {
                if (string.trim() === '') return;
                
                const resultDiv = document.createElement('div');
                resultDiv.className = 'array-result';
                
                switch(activeFunction) {
                    case 'preg_match':
                        processPregMatch(regex, string, resultDiv);
                        break;
                    case 'preg_match_all':
                        processPregMatchAll(regex, string, resultDiv);
                        break;
                    case 'preg_replace':
                        processPregReplace(regex, string, replacement, resultDiv);
                        break;
                    case 'preg_grep':
                        processPregGrep(regex, string, resultDiv, index);
                        break;
                    case 'preg_split':
                        processPregSplit(regex, string, resultDiv);
                        break;
                }
                
                resultsDiv.appendChild(resultDiv);
            });
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error">Invalid regular expression: ${error.message}</div>`;
        }
    }
    
    // Process preg_match
    function processPregMatch(regex, string, resultDiv) {
        const match = string.match(regex);
        
        if (match) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'array-header';
            headerDiv.innerHTML = `<span class="array-toggle">▼</span> array( ${match.length} )`;
            resultDiv.appendChild(headerDiv);
            
            match.forEach((item, i) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'array-item';
                itemDiv.innerHTML = `<span class="array-key">${i}</span> => <span class="array-value">${item || ''}</span>`;
                resultDiv.appendChild(itemDiv);
            });
        } else {
            resultDiv.innerHTML = '<div>No matches found</div>';
        }
    }
    
    // Process preg_match_all
    function processPregMatchAll(regex, string, resultDiv) {
        regex.lastIndex = 0;
        let matches = [];
        let match;
        let groupCount = null;
        let globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
        while ((match = globalRegex.exec(string)) !== null) {
            if (groupCount === null) groupCount = match.length;
            for (let i = 0; i < match.length; i++) {
                if (!matches[i]) matches[i] = [];
                matches[i].push(match[i] || '');
            }
            if (match[0] === '') globalRegex.lastIndex++;
        }
        if (matches.length > 0 && matches[0].length > 0) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'array-header';
            headerDiv.innerHTML = `<span class="array-toggle">▼</span> array( ${matches.length} )`;
            resultDiv.appendChild(headerDiv);

            for (let i = 0; i < matches.length; i++) {
                const subheaderDiv = document.createElement('div');
                subheaderDiv.className = 'array-item';
                subheaderDiv.innerHTML = `<span class="array-toggle">▼</span> ${i}: array( ${matches[i].length} )`;
                resultDiv.appendChild(subheaderDiv);

                for (let j = 0; j < matches[i].length; j++) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'array-item';
                    itemDiv.style.paddingLeft = '40px';
                    itemDiv.innerHTML = `<span class="array-key">${j}</span> => <span class="array-value">${matches[i][j]}</span>`;
                    resultDiv.appendChild(itemDiv);
                }
            }
        } else {
            resultDiv.innerHTML = '<div>No matches found</div>';
        }
    }
    
    // Process preg_replace
    function processPregReplace(regex, string, replacement, resultDiv) {
        try {
            // Replace $n with capture group references
            const jsReplacement = replacement.replace(/\$(\d+)/g, '$$$$1');
            const replaced = string.replace(regex, jsReplacement);
            
            resultDiv.innerHTML = `<div class="array-header">Input: <span class="array-value">${string}</span></div>
                                  <div class="array-header">Output: <span class="array-value">${replaced}</span></div>`;
        } catch (error) {
            resultDiv.innerHTML = `<div class="error">Error during replacement: ${error.message}</div>`;
        }
    }
    
    // Process preg_grep
    function processPregGrep(regex, string, resultDiv, index) {
        const matches = regex.test(string);
        
        if (matches) {
            resultDiv.innerHTML = `<div class="array-header"><span class="array-key">${index}</span> => <span class="array-value">${string}</span></div>`;
        } else {
            // Don't display non-matching lines for preg_grep
            resultDiv.style.display = 'none';
        }
    }
    
    // Process preg_split
    function processPregSplit(regex, string, resultDiv) {
        const parts = string.split(regex);
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'array-header';
        headerDiv.innerHTML = `<span class="array-toggle">▼</span> array( ${parts.length} )`;
        resultDiv.appendChild(headerDiv);
        
        parts.forEach((part, i) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'array-item';
            itemDiv.innerHTML = `<span class="array-key">${i}</span> => <span class="array-value">${part}</span>`;
            resultDiv.appendChild(itemDiv);
        });
    }
    
    // Event listeners for real-time updates
    regexPattern.addEventListener('input', updateResults);
    regexOptions.addEventListener('input', updateResults);
    replacementPattern.addEventListener('input', updateResults);
    testStrings.addEventListener('input', updateResults);
    
    // Function button click handlers
    functionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            functionButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set active function
            activeFunction = this.id;
            
            // Update results
            updateResults();
        });
    });
    
    // Make permalink button
    makePermalinkBtn.addEventListener('click', function() {
        const params = new URLSearchParams();
        params.set('pattern', regexPattern.value);
        params.set('options', regexOptions.value);
        params.set('replacement', replacementPattern.value);
        params.set('text', testStrings.value);
        params.set('function', activeFunction);
        
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(url)
            .then(() => alert('Permalink copied to clipboard!'))
            .catch(err => console.error('Failed to copy: ', err));
    });
    
    // Clear form button
    clearFormBtn.addEventListener('click', function() {
        regexPattern.value = '';
        regexOptions.value = '';
        replacementPattern.value = '';
        testStrings.value = '';
        
        updateResults();
    });
    
    // Check for URL parameters on page load
    function loadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('pattern')) {
            regexPattern.value = params.get('pattern');
        }
        
        if (params.has('options')) {
            regexOptions.value = params.get('options');
        }
        
        if (params.has('replacement')) {
            replacementPattern.value = params.get('replacement');
        }
        
        if (params.has('text')) {
            testStrings.value = params.get('text');
        }
        
        if (params.has('function')) {
            const func = params.get('function');
            const funcButton = document.getElementById(func);
            
            if (funcButton) {
                functionButtons.forEach(btn => btn.classList.remove('active'));
                funcButton.classList.add('active');
                activeFunction = func;
            }
        }
        
        // Update results
        updateResults();
    }
      // Server-side regex processing
    async function processRegexServer(pattern, options, replacement, strings) {
        if (!pattern) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        const data = {
            pattern: pattern,
            options: options,
            replacement: replacement,
            strings: strings,
            function: activeFunction
        };
        
        try {
            const response = await fetch('process.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const result = await response.json();
            
            if (result.error) {
                resultsDiv.innerHTML = `<div class="error">${result.error}</div>`;
                return;
            }
            
            // Clear previous results
            resultsDiv.innerHTML = '';
            
            // Display results
            result.results.forEach(r => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'array-result';
                
                switch(activeFunction) {
                    case 'preg_match':
                        displayPregMatchServerResult(r, resultDiv);
                        break;
                    case 'preg_match_all':
                        displayPregMatchAllServerResult(r, resultDiv);
                        break;
                    case 'preg_replace':
                        displayPregReplaceServerResult(r, resultDiv);
                        break;
                    case 'preg_grep':
                        displayPregGrepServerResult(r, resultDiv);
                        break;
                    case 'preg_split':
                        displayPregSplitServerResult(r, resultDiv);
                        break;
                }
                
                if (resultDiv.innerHTML) {
                    resultsDiv.appendChild(resultDiv);
                }
            });
        } catch (error) {
            console.error('Error:', error);
            // Fall back to client-side processing
            useServerProcessing = false;
            processRegex(pattern, options, replacement, strings);
        }
    }
    
    // Display server-side preg_match results
    function displayPregMatchServerResult(result, resultDiv) {
        if (result.error) {
            resultDiv.innerHTML = `<div class="error">${result.error}</div>`;
            return;
        }
        
        if (result.success && result.matches && Object.keys(result.matches).length > 0) {
            const matches = result.matches;
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'array-header';
            headerDiv.innerHTML = `<span class="array-toggle">▼</span> array( ${Object.keys(matches).length} )`;
            resultDiv.appendChild(headerDiv);
            
            for (const [key, value] of Object.entries(matches)) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'array-item';
                itemDiv.innerHTML = `<span class="array-key">${key}</span> => <span class="array-value">${value}</span>`;
                resultDiv.appendChild(itemDiv);
            }
        } else {
            resultDiv.innerHTML = '<div>No matches found</div>';
        }
    }
    
    // Display server-side preg_match_all results
    function displayPregMatchAllServerResult(result, resultDiv) {
        if (result.error) {
            resultDiv.innerHTML = `<div class="error">${result.error}</div>`;
            return;
        }
        
        if (result.success && result.matches && Object.keys(result.matches).length > 0) {
            const matches = result.matches;

            const headerDiv = document.createElement('div');
            headerDiv.className = 'array-header';
            headerDiv.innerHTML = `<span class="array-toggle">▼</span> array( ${Object.keys(matches).length} )`;
            resultDiv.appendChild(headerDiv);

            for (const [key, group] of Object.entries(matches)) {
                const subheaderDiv = document.createElement('div');
                subheaderDiv.className = 'array-item';
                subheaderDiv.innerHTML = `<span class="array-toggle">▼</span> ${key}: array( ${group.length} )`;
                resultDiv.appendChild(subheaderDiv);

                for (let i = 0; i < group.length; i++) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'array-item';
                    itemDiv.style.paddingLeft = '40px';
                    itemDiv.innerHTML = `<span class="array-key">${i}</span> => <span class="array-value">${group[i]}</span>`;
                    resultDiv.appendChild(itemDiv);
                }
            }
        } else {
            resultDiv.innerHTML = '<div>No matches found</div>';
        }
    }
    
    // Display server-side preg_replace results
    function displayPregReplaceServerResult(result, resultDiv) {
        if (result.error) {
            resultDiv.innerHTML = `<div class="error">${result.error}</div>`;
            return;
        }
        
        resultDiv.innerHTML = `
            <div class="array-header">Input: <span class="array-value">${result.original}</span></div>
            <div class="array-header">Output: <span class="array-value">${result.replaced}</span></div>
        `;
    }
    
    // Display server-side preg_grep results
    function displayPregGrepServerResult(result, resultDiv) {
        if (result.error) {
            resultDiv.innerHTML = `<div class="error">${result.error}</div>`;
            return;
        }
        
        if (result.matched) {
            resultDiv.innerHTML = `<div class="array-header">Matched: <span class="array-value">${result.string}</span></div>`;
        } else {
            // Don't display non-matching lines for preg_grep
            resultDiv.style.display = 'none';
        }
    }
    
    // Display server-side preg_split results
    function displayPregSplitServerResult(result, resultDiv) {
        if (result.error) {
            resultDiv.innerHTML = `<div class="error">${result.error}</div>`;
            return;
        }
        
        if (result.parts && result.parts.length > 0) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'array-header';
            headerDiv.innerHTML = `<span class="array-toggle">▼</span> array( ${result.parts.length} )`;
            resultDiv.appendChild(headerDiv);
            
            result.parts.forEach((part, i) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'array-item';
                itemDiv.innerHTML = `<span class="array-key">${i}</span> => <span class="array-value">${part}</span>`;
                resultDiv.appendChild(itemDiv);
            });
        } else {
            resultDiv.innerHTML = '<div>No splits performed</div>';
        }
    }
    
    // Check if server-side processing is available
    async function checkServerProcessing() {
        try {
            const response = await fetch('process.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ test: true })
            });
            
            if (response.ok) {
                useServerProcessing = true;
                console.log('Using server-side regex processing');
                // Refresh results with server processing
                updateResults();
            }
        } catch (error) {
            console.log('Server-side processing not available, using client-side');
            useServerProcessing = false;
        }
    }
    
    // Load from URL and initialize results
    loadFromUrl();
    updateResults();
    checkServerProcessing();
});
