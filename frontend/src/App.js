import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Virtual File System Implementation
class VirtualFileSystem {
  constructor() {
    this.root = {
      type: 'directory',
      name: '/',
      children: {
        'home': {
          type: 'directory',
          name: 'home',
          children: {
            'user': {
              type: 'directory',
              name: 'user',
              children: {}
            }
          }
        },
        'tmp': {
          type: 'directory',
          name: 'tmp',
          children: {}
        }
      }
    };
    this.currentPath = '/home/user';
  }

  // Get current working directory
  getCurrentDirectory() {
    return this.navigateToPath(this.currentPath);
  }

  // Navigate to a path and return the directory object
  navigateToPath(path) {
    if (path === '/') return this.root;
    
    const parts = path.split('/').filter(p => p !== '');
    let current = this.root;
    
    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        return null;
      }
      current = current.children[part];
    }
    
    return current;
  }

  // Resolve relative/absolute paths
  resolvePath(path) {
    if (path.startsWith('/')) {
      return path;
    }
    
    if (path === '.' || path === '') {
      return this.currentPath;
    }
    
    if (path === '..') {
      const parts = this.currentPath.split('/').filter(p => p !== '');
      if (parts.length > 0) {
        parts.pop();
        return parts.length > 0 ? '/' + parts.join('/') : '/';
      }
      return '/';
    }
    
    if (path.startsWith('./')) {
      path = path.substring(2);
    }
    
    if (path.startsWith('../')) {
      const parts = this.currentPath.split('/').filter(p => p !== '');
      const pathParts = path.split('/');
      
      for (const part of pathParts) {
        if (part === '..') {
          if (parts.length > 0) parts.pop();
        } else if (part !== '.') {
          parts.push(part);
        }
      }
      
      return parts.length > 0 ? '/' + parts.join('/') : '/';
    }
    
    return this.currentPath === '/' ? '/' + path : this.currentPath + '/' + path;
  }

  // Get parent directory path
  getParentPath(path) {
    const parts = path.split('/').filter(p => p !== '');
    if (parts.length <= 1) return '/';
    parts.pop();
    return '/' + parts.join('/');
  }

  // Get directory name from path
  getBaseName(path) {
    const parts = path.split('/').filter(p => p !== '');
    return parts[parts.length - 1] || '/';
  }
}

// Command Handler Class
class CommandHandler {
  constructor(fs, setOutput) {
    this.fs = fs;
    this.setOutput = setOutput;
    this.commandHistory = [];
  }

  addOutput(text) {
    this.setOutput(prev => [...prev, text]);
  }

  addToHistory(command) {
    this.commandHistory.push(command);
  }

  execute(command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'ls':
        return this.ls(args);
      case 'cd':
        return this.cd(args);
      case 'mkdir':
        return this.mkdir(args);
      case 'rmdir':
        return this.rmdir(args);
      case 'touch':
        return this.touch(args);
      case 'rm':
        return this.rm(args);
      case 'mv':
        return this.mv(args);
      case 'cp':
        return this.cp(args);
      case 'curl':
        return this.curl(args);
      case 'pwd':
        return this.pwd();
      case 'clear':
        this.setOutput([]);
        return '';
      case 'cat':
        return this.cat(args);
      case 'echo':
        return this.echo(args);
      case 'head':
        return this.head(args);
      case 'tail':
        return this.tail(args);
      case 'grep':
        return this.grep(args);
      case 'find':
        return this.find(args);
      case 'wc':
        return this.wc(args);
      case 'date':
        return this.date();
      case 'whoami':
        return this.whoami();
      case 'history':
        return this.history();
      case 'help':
        return this.help();
      case 'tree':
        return this.tree(args);
      case 'du':
        return this.du(args);
      case 'ps':
        return this.ps();
      case 'uptime':
        return this.uptime();
      default:
        return `Command not recognized: ${cmd}`;
    }
  }

  ls(args) {
    const path = args[0] ? this.fs.resolvePath(args[0]) : this.fs.currentPath;
    const dir = this.fs.navigateToPath(path);
    
    if (!dir) {
      return `ls: cannot access '${args[0] || path}': No such file or directory`;
    }
    
    if (dir.type !== 'directory') {
      return `ls: ${args[0] || path}: Not a directory`;
    }
    
    const items = Object.keys(dir.children).sort();
    if (items.length === 0) {
      return '';
    }
    
    return items.map(item => {
      const child = dir.children[item];
      return child.type === 'directory' ? `${item}/` : item;
    }).join('  ');
  }

  cd(args) {
    if (args.length === 0) {
      this.fs.currentPath = '/home/user';
      return '';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const dir = this.fs.navigateToPath(targetPath);
    
    if (!dir) {
      return `cd: no such file or directory: ${args[0]}`;
    }
    
    if (dir.type !== 'directory') {
      return `cd: not a directory: ${args[0]}`;
    }
    
    this.fs.currentPath = targetPath;
    return '';
  }

  mkdir(args) {
    if (args.length === 0) {
      return 'mkdir: missing operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const parentPath = this.fs.getParentPath(targetPath);
    const dirName = this.fs.getBaseName(targetPath);
    
    const parent = this.fs.navigateToPath(parentPath);
    if (!parent) {
      return `mkdir: cannot create directory '${args[0]}': No such file or directory`;
    }
    
    if (parent.type !== 'directory') {
      return `mkdir: cannot create directory '${args[0]}': Not a directory`;
    }
    
    if (parent.children[dirName]) {
      return `mkdir: cannot create directory '${args[0]}': File exists`;
    }
    
    parent.children[dirName] = {
      type: 'directory',
      name: dirName,
      children: {}
    };
    
    return '';
  }

  rmdir(args) {
    if (args.length === 0) {
      return 'rmdir: missing operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const parentPath = this.fs.getParentPath(targetPath);
    const dirName = this.fs.getBaseName(targetPath);
    
    const parent = this.fs.navigateToPath(parentPath);
    const target = this.fs.navigateToPath(targetPath);
    
    if (!target) {
      return `rmdir: failed to remove '${args[0]}': No such file or directory`;
    }
    
    if (target.type !== 'directory') {
      return `rmdir: failed to remove '${args[0]}': Not a directory`;
    }
    
    if (Object.keys(target.children).length > 0) {
      return `rmdir: failed to remove '${args[0]}': Directory not empty`;
    }
    
    delete parent.children[dirName];
    return '';
  }

  touch(args) {
    if (args.length === 0) {
      return 'touch: missing file operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const parentPath = this.fs.getParentPath(targetPath);
    const fileName = this.fs.getBaseName(targetPath);
    
    const parent = this.fs.navigateToPath(parentPath);
    if (!parent) {
      return `touch: cannot touch '${args[0]}': No such file or directory`;
    }
    
    if (parent.type !== 'directory') {
      return `touch: cannot touch '${args[0]}': Not a directory`;
    }
    
    if (!parent.children[fileName]) {
      parent.children[fileName] = {
        type: 'file',
        name: fileName,
        content: ''
      };
    }
    
    return '';
  }

  rm(args) {
    if (args.length === 0) {
      return 'rm: missing operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const parentPath = this.fs.getParentPath(targetPath);
    const fileName = this.fs.getBaseName(targetPath);
    
    const parent = this.fs.navigateToPath(parentPath);
    const target = this.fs.navigateToPath(targetPath);
    
    if (!target) {
      return `rm: cannot remove '${args[0]}': No such file or directory`;
    }
    
    if (target.type === 'directory') {
      return `rm: cannot remove '${args[0]}': Is a directory`;
    }
    
    delete parent.children[fileName];
    return '';
  }

  mv(args) {
    if (args.length < 2) {
      return 'mv: missing file operand';
    }
    
    const sourcePath = this.fs.resolvePath(args[0]);
    const targetPath = this.fs.resolvePath(args[1]);
    
    const source = this.fs.navigateToPath(sourcePath);
    if (!source) {
      return `mv: cannot stat '${args[0]}': No such file or directory`;
    }
    
    const sourceParent = this.fs.navigateToPath(this.fs.getParentPath(sourcePath));
    const sourceName = this.fs.getBaseName(sourcePath);
    
    const targetParent = this.fs.navigateToPath(this.fs.getParentPath(targetPath));
    const targetName = this.fs.getBaseName(targetPath);
    
    if (!targetParent) {
      return `mv: cannot move '${args[0]}' to '${args[1]}': No such file or directory`;
    }
    
    // Create copy at target location
    targetParent.children[targetName] = { ...source, name: targetName };
    
    // Remove from source location
    delete sourceParent.children[sourceName];
    
    return '';
  }

  cp(args) {
    if (args.length < 2) {
      return 'cp: missing file operand';
    }
    
    const sourcePath = this.fs.resolvePath(args[0]);
    const targetPath = this.fs.resolvePath(args[1]);
    
    const source = this.fs.navigateToPath(sourcePath);
    if (!source) {
      return `cp: cannot stat '${args[0]}': No such file or directory`;
    }
    
    const targetParent = this.fs.navigateToPath(this.fs.getParentPath(targetPath));
    const targetName = this.fs.getBaseName(targetPath);
    
    if (!targetParent) {
      return `cp: cannot create '${args[1]}': No such file or directory`;
    }
    
    if (source.type === 'directory') {
      // Simple directory copy (shallow)
      targetParent.children[targetName] = {
        type: 'directory',
        name: targetName,
        children: { ...source.children }
      };
    } else {
      // File copy
      targetParent.children[targetName] = { ...source, name: targetName };
    }
    
    return '';
  }

  curl(args) {
    if (args.length === 0) {
      return 'curl: no URL specified';
    }
    
    const url = args[0];
    
    // Simulate different responses based on URL patterns
    if (url.includes('json') || url.includes('api')) {
      return `{
  "status": "success",
  "data": {
    "message": "This is a simulated JSON response",
    "timestamp": "${new Date().toISOString()}",
    "url": "${url}"
  }
}`;
    } else if (url.includes('html')) {
      return `<!DOCTYPE html>
<html>
<head><title>Simulated Response</title></head>
<body><h1>Hello from ${url}</h1></body>
</html>`;
    } else {
      return `Simulated response from ${url}
Status: 200 OK
Content-Type: text/plain
Content-Length: 42

This is a dummy response for testing curl.`;
    }
  }

  pwd() {
    return this.fs.currentPath;
  }

  cat(args) {
    if (args.length === 0) {
      return 'cat: missing file operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const file = this.fs.navigateToPath(targetPath);
    
    if (!file) {
      return `cat: ${args[0]}: No such file or directory`;
    }
    
    if (file.type === 'directory') {
      return `cat: ${args[0]}: Is a directory`;
    }
    
    return file.content || '';
  }

  echo(args) {
    const text = args.join(' ');
    
    // Check if redirecting to file (echo "text" > file.txt)
    const redirectIndex = args.indexOf('>');
    if (redirectIndex !== -1 && redirectIndex < args.length - 1) {
      const content = args.slice(0, redirectIndex).join(' ');
      const fileName = args[redirectIndex + 1];
      const targetPath = this.fs.resolvePath(fileName);
      const parentPath = this.fs.getParentPath(targetPath);
      const baseName = this.fs.getBaseName(targetPath);
      
      const parent = this.fs.navigateToPath(parentPath);
      if (!parent) {
        return `echo: cannot create '${fileName}': No such file or directory`;
      }
      
      parent.children[baseName] = {
        type: 'file',
        name: baseName,
        content: content
      };
      
      return '';
    }
    
    return text;
  }

  head(args) {
    if (args.length === 0) {
      return 'head: missing file operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const file = this.fs.navigateToPath(targetPath);
    
    if (!file) {
      return `head: cannot open '${args[0]}' for reading: No such file or directory`;
    }
    
    if (file.type === 'directory') {
      return `head: error reading '${args[0]}': Is a directory`;
    }
    
    const lines = (file.content || '').split('\n');
    return lines.slice(0, 10).join('\n');
  }

  tail(args) {
    if (args.length === 0) {
      return 'tail: missing file operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const file = this.fs.navigateToPath(targetPath);
    
    if (!file) {
      return `tail: cannot open '${args[0]}' for reading: No such file or directory`;
    }
    
    if (file.type === 'directory') {
      return `tail: error reading '${args[0]}': Is a directory`;
    }
    
    const lines = (file.content || '').split('\n');
    return lines.slice(-10).join('\n');
  }

  grep(args) {
    if (args.length < 2) {
      return 'grep: missing pattern or file';
    }
    
    const pattern = args[0];
    const fileName = args[1];
    const targetPath = this.fs.resolvePath(fileName);
    const file = this.fs.navigateToPath(targetPath);
    
    if (!file) {
      return `grep: ${fileName}: No such file or directory`;
    }
    
    if (file.type === 'directory') {
      return `grep: ${fileName}: Is a directory`;
    }
    
    const lines = (file.content || '').split('\n');
    const matches = lines.filter(line => line.includes(pattern));
    
    return matches.join('\n');
  }

  find(args) {
    const searchPath = args[0] || this.fs.currentPath;
    const searchName = args.length > 2 && args[1] === '-name' ? args[2] : '';
    
    const findInDirectory = (dir, currentPath, results = []) => {
      if (!dir || dir.type !== 'directory') return results;
      
      for (const [name, item] of Object.entries(dir.children)) {
        const itemPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        
        if (!searchName || name.includes(searchName.replace(/"/g, ''))) {
          results.push(itemPath);
        }
        
        if (item.type === 'directory') {
          findInDirectory(item, itemPath, results);
        }
      }
      
      return results;
    };
    
    const startDir = this.fs.navigateToPath(this.fs.resolvePath(searchPath));
    if (!startDir) {
      return `find: '${searchPath}': No such file or directory`;
    }
    
    const results = findInDirectory(startDir, this.fs.resolvePath(searchPath));
    return results.join('\n');
  }

  wc(args) {
    if (args.length === 0) {
      return 'wc: missing file operand';
    }
    
    const targetPath = this.fs.resolvePath(args[0]);
    const file = this.fs.navigateToPath(targetPath);
    
    if (!file) {
      return `wc: ${args[0]}: No such file or directory`;
    }
    
    if (file.type === 'directory') {
      return `wc: ${args[0]}: Is a directory`;
    }
    
    const content = file.content || '';
    const lines = content.split('\n').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    
    return `  ${lines}  ${words}  ${chars} ${args[0]}`;
  }

  date() {
    return new Date().toString();
  }

  whoami() {
    return 'user';
  }

  history() {
    return this.commandHistory.length > 0 
      ? this.commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n')
      : 'No commands in history';
  }

  help() {
    return `Available commands:
  ls [path]           - List directory contents
  cd [path]           - Change directory
  mkdir <name>        - Create directory
  rmdir <name>        - Remove empty directory
  touch <file>        - Create file
  rm <file>           - Remove file
  mv <src> <dest>     - Move/rename file or directory
  cp <src> <dest>     - Copy file or directory
  cat <file>          - Display file contents
  echo <text>         - Print text (use > to redirect to file)
  head <file>         - Show first 10 lines of file
  tail <file>         - Show last 10 lines of file
  grep <pattern> <file> - Search for pattern in file
  find [path] [-name pattern] - Find files
  wc <file>           - Count lines, words, characters
  tree [path]         - Display directory tree
  du [path]           - Show disk usage
  curl <url>          - Simulate HTTP request
  pwd                 - Print working directory
  date                - Show current date and time
  whoami              - Show current user
  ps                  - Show running processes
  uptime              - Show system uptime
  clear               - Clear screen
  help                - Show this help message`;
  }

  tree(args) {
    const targetPath = args[0] ? this.fs.resolvePath(args[0]) : this.fs.currentPath;
    const dir = this.fs.navigateToPath(targetPath);
    
    if (!dir) {
      return `tree: ${args[0] || targetPath}: No such file or directory`;
    }
    
    if (dir.type !== 'directory') {
      return `tree: ${args[0] || targetPath}: Not a directory`;
    }
    
    const buildTree = (directory, prefix = '', isLast = true) => {
      let result = '';
      const items = Object.entries(directory.children);
      
      items.forEach(([name, item], index) => {
        const isLastItem = index === items.length - 1;
        const currentPrefix = prefix + (isLastItem ? '└── ' : '├── ');
        result += currentPrefix + name + (item.type === 'directory' ? '/' : '') + '\n';
        
        if (item.type === 'directory') {
          const nextPrefix = prefix + (isLastItem ? '    ' : '│   ');
          result += buildTree(item, nextPrefix, isLastItem);
        }
      });
      
      return result;
    };
    
    const baseName = this.fs.getBaseName(targetPath);
    let result = baseName === '/' ? '/' : baseName + '/\n';
    result += buildTree(dir);
    
    return result.trim();
  }

  du(args) {
    const targetPath = args[0] ? this.fs.resolvePath(args[0]) : this.fs.currentPath;
    const target = this.fs.navigateToPath(targetPath);
    
    if (!target) {
      return `du: cannot access '${args[0] || targetPath}': No such file or directory`;
    }
    
    const calculateSize = (item) => {
      if (item.type === 'file') {
        return (item.content || '').length;
      } else if (item.type === 'directory') {
        return Object.values(item.children).reduce((total, child) => {
          return total + calculateSize(child);
        }, 0);
      }
      return 0;
    };
    
    const size = calculateSize(target);
    const sizeInKB = Math.ceil(size / 1024) || 1; // Minimum 1KB
    
    return `${sizeInKB}\t${targetPath}`;
  }

  ps() {
    return `  PID TTY          TIME CMD
    1 pts/0    00:00:00 web-cli
    2 pts/0    00:00:00 terminal
   42 pts/0    00:00:00 bash`;
  }

  uptime() {
    const startTime = Date.now() - Math.floor(Math.random() * 3600000); // Random uptime up to 1 hour
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;
    
    return `up ${minutes} min, 1 user, load average: 0.${Math.floor(Math.random() * 100)}, 0.${Math.floor(Math.random() * 100)}, 0.${Math.floor(Math.random() * 100)}`;
  }
}

// Main Terminal Component
function Terminal() {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fs] = useState(() => new VirtualFileSystem());
  const [commandHandler] = useState(() => new CommandHandler(fs, setOutput));
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    // Create some sample files for demonstration
    const homeDir = fs.navigateToPath('/home/user');
    homeDir.children['readme.txt'] = {
      type: 'file',
      name: 'readme.txt',
      content: `Welcome to Web CLI Terminal!

This is a fully functional command-line interface that runs in your browser.

Available commands include:
- File operations: ls, cd, mkdir, touch, rm, mv, cp
- File viewing: cat, head, tail, grep
- System info: pwd, date, whoami, ps, uptime
- Utilities: find, wc, tree, du, curl
- Type 'help' for a complete list

Try these examples:
  cat readme.txt
  echo "Hello World" > hello.txt
  grep "command" readme.txt
  tree /
  find . -name "*.txt"

Have fun exploring!`
    };
    
    homeDir.children['sample.json'] = {
      type: 'file',
      name: 'sample.json',
      content: `{
  "name": "Web CLI Demo",
  "version": "1.0.0",
  "features": [
    "Virtual File System",
    "Command History",
    "Path Resolution",
    "File Operations"
  ]
}`
    };

    // Welcome message
    setOutput([
      '╔══════════════════════════════════════════════════════════════════════╗',
      '║                     🚀 Web CLI Terminal v1.0                        ║',
      '║                                                                      ║',
      '║  A fully functional command-line interface running in your browser  ║',
      '║                                                                      ║',
      '║  📁 Virtual File System  |  📜 Command History  |  🛠️  20+ Commands   ║',
      '╚══════════════════════════════════════════════════════════════════════╝',
      '',
      '💡 Quick Start:',
      '   • Type "help" to see all available commands',
      '   • Use ↑/↓ arrow keys for command history',
      '   • Try "ls" to see files, "cat readme.txt" to read the guide',
      '   • Create files with "touch" or "echo text > file.txt"',
      '',
      '🎯 Sample commands to try:',
      '   cat readme.txt     # Read the welcome guide',
      '   tree /             # See the directory structure',
      '   echo "test" > new.txt && cat new.txt',
      '   find . -name "*.txt" # Find all text files',
      '',
    ]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const command = input.trim();
      if (command) {
        // Add to history
        setHistory(prev => [...prev, command]);
        commandHandler.addToHistory(command);
        setHistoryIndex(-1);
        
        // Add command to output
        const prompt = `${fs.currentPath}$ ${command}`;
        setOutput(prev => [...prev, prompt]);
        
        // Execute command
        const result = commandHandler.execute(command);
        if (result) {
          setOutput(prev => [...prev, result]);
        }
      } else {
        setOutput(prev => [...prev, `${fs.currentPath}$ `]);
      }
      
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="terminal-container" onClick={handleTerminalClick}>
      <div className="terminal-header">
        <div className="terminal-buttons">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
        </div>
        <div className="terminal-title">Web CLI Terminal</div>
      </div>
      
      <div className="terminal-content" ref={outputRef}>
        <div className="terminal-output">
          {output.map((line, index) => (
            <div key={index} className="terminal-line">
              {line}
            </div>
          ))}
        </div>
        
        <div className="terminal-input-line">
          <span className="terminal-prompt">{fs.currentPath}$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            className="terminal-input"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <Terminal />
    </div>
  );
}

export default App;