import {
  db,
  getCurrentFile,
  getCurrentProjectPath,
  getLatestProject,
  readFileByPath,
  trackProjectFileClick,
  updateFileContent,
  updateMetaFile,
} from '../modules/db/db.js';
import {
  __define,
  __main_module,
  __require,
  onPage,
  isObject,
  isArray,
} from '../modules/oop/oop.js';
import Breadcrumbs from './Breadcrumbs.js';
import TouchCursors from './TouchCursor.js';
import { BranchModeHtml, BranchModeJs } from './highlight/highlight.js';

import { cssSupportColor } from './property/property-css.js';

const fileCache = new Map();

const state = new Map();
onPage('home', e => {
  for (const [k, v] of [...state.entries()]) {
    // v.destroy();
  }
  // fileCache.clear()
  for (const [k, v] of [...fileCache.entries()]) {
  }
});

const selectTab = tabId => {};
__define('editor/sessions', 'extentionsMap', {
  js: 'devicon-javascript-plain colored',
  cjs: 'devicon-javascript-plain colored',
  mjs: 'devicon-javascript-plain colored',
  html: 'devicon-html5-plain colored',
  htm: 'devicon-html5-plain colored',
  css: 'devicon-css3-plain colored',
  ts: 'devicon-typescript-plain colored',
  tsx: 'devicon-typescript-plain colored',
  jsx: 'devicon-react-original colored',
  json: 'devicon-json-plain colored',
  md: 'devicon-markdown-original colored',
});

const extentions = __require('editor/sessions/extentionsMap');

function has(key, from) {
  if (typeof from === 'object' && !isArray(from)) {
    return void console.error(from, ' is not interabel');
  }

  return from.includes(key) ? true : false;
}

class AceWorkerManager {
  constructor() {
    this.pool = new Map();
  }

  attachSessions(session, modePath) {
    if (!modePath) return;

    // pindah mode = kurangi count mode lama
    if (session.__wm_prevMode && session.__wm_prevMode !== modePath) {
      this._release(session.__wm_prevMode);
    }

    const existing = this.pool.get(modePath);

    if (existing) {
      // pakai worker pool
      if (session.$worker && session.$worker !== existing.worker) {
        try {
          session.$worker?.terminate();
        } catch {}
      }

      session.$worker = existing.worker;
      existing.count++;
    } else {
      // mode belum ada di pool → bikin entri baru
      this.pool.set(modePath, {
        worker: session.$worker || null,
        count: 1,
      });
    }

    session.__wm_prevMode = modePath;
  }

  detachSession(session) {
    const mode = session.__wm_prevMode;
    if (!mode) return;

    this._release(mode);
    session.__wm_prevMode = null;
  }

  _release(modePath) {
    const entry = this.pool.get(modePath);
    if (!entry) return;

    entry.count--;
    if (entry.count <= 0) {
      try {
        entry.worker?.terminate?.();
      } catch {}
      this.pool.delete(modePath);
    }
  }

  dump() {
    return [...this.pool.entries()].map(([mode, e]) => ({
      mode,
      count: e.count,
      hasWorker: !!e.worker,
    }));
  }
}

const optionsdefault = {
  theme: 'ace/theme/github_dark',
  scrollPastEnd: 0.75,
  dragEnabled: false,
  autoScrollEditorIntoView: true,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  cursorStyle: 'smooth',
  tabSize: 2,
  showPrintMargin: false,
  highlightActiveLine: false,
  wrap: true,
  fixedWidthGutter: true,
  animatedScroll: true,
};
export { optionsdefault };
export const workerMgr = new AceWorkerManager();
export let sessions = Object.create(null);

onPage('home', e => {
  for (const [prop, session] of Object.entries(sessions)) {
    // console.log(prop,session)
    workerMgr.detachSession(session);
  }
});

const workerUrl = () => {
  const workerScript = `
  self.onmessage = (event) => {
  const data = event.data;
  if (!Array.isArray(data)) {
    self.postMessage({ 
      type: "log", 
      message: "Data bukan array, worker dibatalkan.", 
      data 
    });
    return;
  }

  self.postMessage({ 
    type: "log", 
    message: "Menerima data", 
    data 
  });

  const structured = data.map(item => (item));
console.log(structured)
  self.postMessage({ type: "result", data: structured });
};
`;
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
};




import { Tabs } from '../modules/commponets/Tab.js';
export function normalizePath(path) {
  // idb/<project>/*
  if (path.startsWith('idb/')) {
    return path.replace(/^idb\/[^/]+\//, '/');
  }

  // storage/emulated/0/<project>/*
  return path.replace(/^storage\/emulated\/\d+\/[^/]+\//, '/');
}

class Fs {
  constructor() {
    this.db = db;
  }

  async getAllFiles() {
    const currentProjectPath = await getCurrentProjectPath();
    const data = await this.db.files.toArray();
    var $data = [];
    const filtered = data.filter(p => p.path.startsWith(currentProjectPath));

    for (const m of filtered) {
      const recordData = await this.db.data.where('fid').equals(m.fid).first();
      const obj = {};
      const exist = m.path.startsWith(currentProjectPath);

      var content = recordData.text;
      obj.path = normalizePath(m.path);
      obj.fileName = m.path.split('/').pop();

      if (typeof recordData.encoding === 'binary') {
        const decoder = new TextDecoder('utf-8');
        content = decoder.decode(recordData.text);
      }
      obj.content = content;
      if (exist) $data.push(obj);
    }
    return $data;
  }
}
class EditorManager {
  constructor(editor, rootContainer) {
    this.editor = editor; //instance
    const tab = new Tabs(null, editor);
    this.tab = tab;
    tab.parent = tab.createNode('div', {
      class: 'file-tb',
    });
    
this.root = rootContainer;
this.root.append(tab.parent);

    (async () => {
    const saved = await tab.loadDataFromDb();
    
// const fileRecord = await db.files.where('path').equals().first();     
window.addEventListener("project-removed", async e => {
  // await trackProjectFileClick(tab.data = {});
const payload = {
    recentFilePaths: [],
    openedFilePaths: [],
    unpinnedTabs: [],
    currentFilePath: '',
    
  };
  
  tab.data = payload
  await trackProjectFileClick(payload)
  
})


async function projectIsEmpty() {
  // Pakai for biasa atau map untuk handle async di dalam loop
  for (let path of saved.openedFilePaths) {
    if (!path) continue;
    
    const fileRecord = await db.files.where('path').equals(path).first(); 
    
    if (typeof(fileRecord) === "undefined") {
      // Hapus path yang bermasalah dari array openedFilePaths
      tab.data.openedFilePaths = tab.data.openedFilePaths.filter(p => p !== path);
      
      // Hapus juga dari unpinnedTabs jika strukturnya sejajar
      // (Asumsi index-nya sama, ini cara amannya)
      if (tab.data.unpinnedTabs) {
        tab.data.unpinnedTabs = tab.data.unpinnedTabs.filter((_, index) => {
          return saved.openedFilePaths[index] !== path;
        });
      }

      console.log(`Path dihapus karena tidak ada di DB: ${path}`);
      
      // Update DB agar data yang "kotor" tadi tidak tersimpan lagi
      await trackProjectFileClick(tab.data);
    }
  }
}


      if (saved && saved.openedFilePaths && saved.openedFilePaths.length) {
        tab.data = saved;
        
       
        // 1. Render UI dasar untuk semua tab
       tab.renderTabs();

        const activePath = saved.currentFilePath;

        // 2. Loop melalui semua path untuk menginisialisasi SEMUA session
        
        for (const filePath of saved.openedFilePaths) {
          const content = await readFileByPath(filePath);


   
          const mode = tab.getModeByExtension(tab.getExt(filePath));
   
          // Set session untuk setiap file agar data tersedia di memori
          tab.setSession(filePath, content ? content :  (tab.getExt(filePath) === 'html' ? "<!-- konten file tidak ada! atau file belum dibuat smaa sekali. -->" : "// konten file tidak ada! atau file belum dibuat smaa sekali.") || "", mode);

          // 3. Gunakan 'continue' untuk mencegah tab lain ikut 'fokus' atau 'switch'
          // Jika filePath bukan yang aktif, lewati bagian aktivasi UI di bawah
          if (filePath !== activePath) {
            continue;
          }

          // 4. Baris ini hanya akan jalan SEKALI untuk tab yang benar-benar aktif
          tab.switchToTab(filePath);

          if (tab.activeNode && tab.activeNode.anchor) {
            tab.activeNode.anchor.classList.add('active');
            tab.activeNode.anchor.tabIndex = 0;
            tab.activeNode.anchor.focus();
          }
        }
      }
    })();


tab.renderTabs();
tab.initDragTabs();
    document.addEventListener('file:change', async function (event) {
      try {
        
        const { fullpath, content } = event.detail;
        const mode = tab.getModeByExtension(tab.getExt(fullpath));

        const existIndex = tab.data.openedFilePaths.indexOf(fullpath);
        const unpinnedIndex = tab.getUnpinnedIndex();

        if (existIndex !== -1) {
          tab.data.currentFilePath = fullpath;
          tab.switchToTab(fullpath);
          tab.refreshTabs();
        } else if (unpinnedIndex !== -1) {
          tab.data.openedFilePaths[unpinnedIndex] = fullpath;
          tab.data.unpinnedTabs[unpinnedIndex] = true;
          tab.setSession(fullpath, content || '', mode);
        } else {
          tab.data.openedFilePaths.push(fullpath);
          tab.data.unpinnedTabs.push(true);
          tab.setSession(fullpath, content || '', mode);
        }
   async function pleaseAwait(time) {
       return new Promise(res => {
       setTimeout(e => {
        res(true) 
       }, time || 1000)  
       })
    }
    
    await pleaseAwait();
    tab.data.currentFilePath = fullpath;
        tab.refreshTabs();
        tab.switchToTab(fullpath);
        
        // 🔥 INI YANG SEBELUMNYA BELUM ADA
        await trackProjectFileClick(tab.data);
       
      } catch (err) {
        console.error(err);
      }
    });
  }
}

// daftar attribute → value

function htmlCompleterValue() {
  const editor = this.editor;
  const langTools = ace.require('ace/ext/language_tools');

  const completers = {
    getCompletions: function (editor, session, pos, prefix, callback) {
      const token = session.getTokenAt(pos.row, pos.column);
      const attrToken = session.getTokenAt(pos.row, token.start - 1);
      const attributeMap = [];
      langTools.keyWordCompleter.getCompletions(
        editor,
        session,
        pos,
        prefix,
        (_, res) => {
          attributeMap.push(...res);
          res.type = 'value';
        },
      );

      // if (token.type === 'entity.other.attribute-name.xml') {
      //   attributeMap.forEach(at => {

      //     return callback(null, {
      //       caption: at.caption,
      //       snippet: at.snippet,
      //       score: at.score,
      //       meta: "attribute",
      //      type: 'property',
      //      completerId: at.completerId
      //     })

      //     /**
      //      * aption
      //     :
      //     "onwaiting"
      //     completerId
      //     :
      //     "keywordCompleter"
      //     meta
      //     :
      //     "attribute"
      //     score
      //     :
      //     1000000
      //     snippet
      //     :
      //     "onwaiting=\"$0\""
      //      */
      // })
      // }
      /*  const filteredSnippets = snippets.filter(c => c.caption.startsWith(prefix));
    callback(null, filteredSnippets)
    console.log()
    */

      const attrMapValues = {
        lang: 'en|id|ru',
        rel: 'stylesheet|noopener|noreferrer|preload',
        target: '_self|_blank|_top|_parent',
      };

      const scriptAttrValue = {
        type: 'module|text/javascript',
        async: '',
        defer: '',
        charset: 'utf-8',
      };

      //console.log(session.doc.$lines, pos)
      //console.log(session.doc.$lines[pos.row])
      //console.log(token.type)
      const currentAttr = attrToken.value;
      switch (token.type) {
        case 'string.attribute-value.xml':
          if (session.doc.$lines[pos.row].startsWith('<script')) {
            Object.entries(scriptAttrValue).forEach(([attr, value]) => {
              if (currentAttr === attr && scriptAttrValue[attr]) {
                const splits = scriptAttrValue[attr].split('|');
                splits
                  .filter(fi => fi.startsWith(prefix))
                  .map(final => {
                    return callback(null, {
                      caption: final,
                      value: final,
                      scrore: 30000,
                      meta: 'value',
                    });
                  });
              }
            });
          }

          Object.entries(attrMapValues).forEach(([attr, value]) => {
            if (currentAttr === attr && attrMapValues[attr]) {
              if (typeof attrMapValues[attr] !== 'string') return;
              const strToAr = attrMapValues[attr].split('|');
              const filtered = strToAr
                .filter(f => f.startsWith(prefix))
                .forEach(final => {
                  callback(null, {
                    caption: final,
                    value: final,
                    scrore: 5000,
                  });
                });
            }
          });
          break;
      } // end switch block;
    },
  };
  editor.completers = (editor.completers || []).concat([completers]);
}

// =======================
// Ambil node folder saat ini berdasarkan file aktif
// =======================
async function getCurrentFolderNode() {
  // Ambil root node project
  const rootNode = window.treeData[0];

  // Ambil path project, misal "idb/MyApp"
  const projectPath = await getCurrentProjectPath();

  // Ambil current file path (state) dan normalisasi ke relPath project
  // Misal hasil: "/src/index.html"
  let activeFile = await getCurrentFile(e => e.replace(projectPath, ''));
  if (!activeFile) return rootNode; // fallback ke root jika tidak ada file aktif

  // pastikan ada leading slash
  if (!activeFile.startsWith('/')) activeFile = '/' + activeFile;

  // Ambil folder path dari current file
  // Jika file "/src/index.html" → relFolderPath = "/src/"
  const relFolderPath = activeFile.endsWith('/')
    ? activeFile
    : activeFile.substring(0, activeFile.lastIndexOf('/') + 1);

  // Cari node folder di tree berdasarkan relFolderPath
  // fallback ke root jika tidak ditemukan
  return getFolderByRelPath(rootNode, relFolderPath) || rootNode;
}

// =======================
// Fungsi bantu: ambil node folder dari tree berdasarkan relPath
// =======================
function getFolderByRelPath(node, relPath) {
  if (!relPath || relPath === '/') return node; // root folder

  // normalisasi "./" di awal atau di tengah path menjadi "/"
  relPath = relPath.replace(/(^|\/)\.\//g, '/');

  const parts = relPath.split('/').filter(Boolean);
  let current = node;

  for (const part of parts) {
    if (part === '..') {
      // mundur ke parent folder
      const parentPath =
        current.relPath.split('/').slice(0, -1).join('/') || '/';
      // rekursif dari root untuk ambil node parent
      current = getFolderByRelPath(window.treeData[0], parentPath);
    } else {
      // maju ke child folder
      if (!current?.children) return null;
      current = current.children.find(
        c => c.name === part && c.type === 'directory',
      );
      if (!current) return null;
    }
  }
  return current;
}

function defaultSnippets(editor, session, pos, prefix, cb) {
  const tools = ace.require('ace/ext/language_tools');

  var list = new Set();
  tools.snippetCompleter.getCompletions(
    editor,
    session,
    pos,
    prefix,
    (_, res) => {
      for (var i of res) {
        list.add(i);
      }
    },
  );

  return [...list];
}
// =======================
// Completer untuk Ace Editor
// =======================
const pathCompleter = {
  id: 'custom-current-path',

  // Fungsi ini dipanggil **setiap kali user menekan tombol autocomplete** atau editor membutuhkan daftar saran
  getCompletions: async function (editor, session, pos, prefix, callback) {
    const line = session.getLine(pos.row);
    var snippet = defaultSnippets(editor, session, pos, prefix, callback);

    var o;
    switch (session.$modeId.split('/').pop()) {
      case 'typescript':
      case 'typescript_ls':
      case 'jsx':
      case 'jsx_ls':
      case 'tsx':
      case 'tsx_ls':
      case 'javascript_ls':
      case 'javascript':
        o = /(from|require\()\s*["']([%\s.\-/a-zA-Z_0-9@]+)/;
        break;
      case 'css':
      case 'css_ls':
      case 'less':
      case 'less_ls':
      case 'scss':
      case 'scss_ls':
        o = /(url\()\s*["']([%\s.\-/a-zA-Z_0-9@]+)/;
        break;
      case 'html_ls':
      case 'html':
        o = /(src|href)\s*=\s*["']([%\s.\-/a-zA-Z_0-9@]+)/;
    }

    // ===== FILTER KHUSUS TRIGGER =====
    const token = session.getTokenAt(pos.row);

    if (o) {
      var match = line.slice(0, pos.column).match(o);

      if (match) {
        var typed = match[2] || '';
        var state;

        switch (match) {
          case 'from' && match.input.startsWith('import'):
            return 'module';
          case 'src' && match.input.startsWith('<script'):
            return 'module';

          // Tab to edit
        }

        // Dapatkan folder node saat ini dari file aktif
        const startNode = await getCurrentFolderNode();
        let folderNode = startNode;

        // Jika typed kosong atau hanya "./" atau "/" → ambil folder saat ini

        if (!typed || typed === './' || typed === '/') {
          typed = '';
        } else {
          // Split typed menjadi path parts
          // Contoh: "../css/style.css" → ["..","css"], last = "style.css"
          const parts = typed.split('/').filter(Boolean);
          const last = parts.pop(); // nama terakhir untuk filter

          // Cari folder node sesuai typed sebelum nama terakhir
          folderNode =
            getFolderByRelPath(startNode, parts.join('/')) || startNode;

          // Filter nama terakhir
          typed = last || '';
        }

        // Jika folder tidak ada atau tidak punya children → kosong
        if (!folderNode || !folderNode.children) return callback(null, []);

        // Mapping children menjadi Ace completions
        const completions = folderNode.children
          .filter(c => c.name.toLowerCase().startsWith(typed.toLowerCase()))
          .map(c => ({
            caption: c.name,
            value: c.type === 'directory' ? c.name + '/' : c.name,
            meta: c.type === 'file' ? 'file' : 'dir',
            type: '',
            score: 4000,
            command: c.type === 'directory' ? 'startAutocomplete' : undefined,
          }));

        // Kirim hasil ke Ace
        callback(null, completions);
      }
    }
  },
  triggerCharacters: ['.', '/'],
};

function registerCompleter(completer) {
  const self = this;
  if (!completer) return;
  return () => {
    self.langTools.setCompleters([completer]);
  };
}


class GCache {}
const gCache = new GCache()
class Editor {
  constructor(root, editor) {
    this.parentTab = document.createElement('div');
    root.append(this.parentTab);
    this.root = root;

    this.editor = ace.edit(editor);
    
    

    this.$editor_manager = new EditorManager(this.editor, root);
    this.langTools = null;
    onerror = e => {
      console.error(e)
    }
    
    this.editor.setOptions(optionsdefault);
    // this.tab = new Tab(this);

    new TouchCursors(this.editor);
  this.init();
  }

  async init() {
    this.signatureTooltip = this.$editor_manager.tab.createNode('div', {
      class: 'ace_signature_tooltip',
      style: 'display: none',
    });

    const _self = this;
    const editor = _self.editor;

    // Tunggu sampai completer aktif
    editor.commands.on('afterExec', function (e) {
      if (e.command.name === 'startAutocomplete') {
        const popup = editor.completer.popup;
        // Paksa popup ke baris pertama (index 0)
        popup.gotoLine(1);
        popup.setRow(0);
      }
    });

    const ace_content = editor.renderer.content;
    const { element } = this.editor.renderer.$cursorLayer;
    this.renderer = this.editor.renderer;
    ace_content && ace_content.appendChild(this.signatureTooltip);
    this.langTools = ace.require('ace/ext/language_tools');

    // const regis = registerCompleter.bind(this);
    //regis(pathCompleter)()
    //attachParent(window.treeData[0]);
    // editor.completers = editor.completers || [];

    await this.initTSWorker();
    //  editor.completers.push(this.registerTSCompleter());

    this.registerTSCompleter(this.langTools);

    this.editor.on('change', delta => {
      if (delta.action !== 'insert' && delta.action !== 'remove') return;

      const ch = delta.lines.join('');

      const line = delta.lines[0];
      const { action } = delta;

      this.handleSignatureHelp(ch, line);
    });

    this.tsWorker.addEventListener('message', e => {
      if (e.data.type !== 'signature') return;

      if (e.data.empty) {
        this.hideSignatureTooltip();
        return;
      }

      this.showSignatureTooltip(
        e.data.prefix,
        e.data.parameters,
        e.data.activeParam,
        e.data.suffix,
      );
    });

    this.editor.on('click', e => {
      this.hideSignatureTooltip();
    });

    this.renderer.on('afterRender', e => {
      this.initSignatureEl();
    });

    // this.langTools.setCompleters([this.registerTSCompleter()]);

    //  htmlCompleterValue.bind(this)();
    //  this.registerCssAutoComplete();
    _self.setFontSize(16);
  }

  handleSignatureHelp(ch, line) {
    const editor = this.editor;
    const session = editor.session;
    const pos = editor.getCursorPosition();
    let offset = session.doc.positionToIndex(pos);

    if (line !== '()' && ch !== ',') {
      this.hideSignatureTooltip();
      //   this.showSignatureTooltip()
      return;
    }

    if (line === '()' || line === ',') {
      offset += 1;

      this.tsWorker.postMessage({
        type: 'signature',
        payload: {
          code: session.getValue(),
          offset,
        },
      });
    }
  }

  initSignatureEl() {
    const { lineHeight, $padding, $cursorLayer } = this.editor.renderer;
    const pixelPos = $cursorLayer.$pixelPos;
    const { left, top } = this.editor.renderer.$cursorLayer.getPixelPosition();

    Object.assign(this.signatureTooltip.style, {
      top: pixelPos.top + lineHeight + 'px',
      left: left / 2 + 'px',
    });
  }
  showSignatureTooltip(prefix, params, active, suffix) {
    // addEventListener()

    const supportKeyword = /\bkeyof\b/;
    const variable_parameter = /type/;

    const rules = [
      {
        regex: /\b(void|keyof|boolean|any|string|number|object|null)\b/g,
        wrap: e => `<span class="ace_keyword">${e}</span>`,
      },
      {
        regex:
          /\b(type|listener|ev|this|url|target|replace|message|optionalParams|data|options|arguments|argument|condition|o|undefined|arrayLike|iterable|Iterable|ArrayLike|thisArg|argArray|index|value)\b/g,
        wrap: e =>
          `<span class="ace_variable ace_parameter" style="text-decoration: underline!important; font-weight: 600">${e}</span>`,
      },
      {
        regex: /([a-zA-Z0-9_$](?<=([...])))/g,
        wrap: e =>
          `<span class="ace_variable ace_parameter" style="text-decoration: underline!important; font-weight: 600">${e}</span>`,
      },
    ];

    rules.push({
      regex: /([a-zA-Z0-9_$]*(?=\())/g,
      wrap: e => `<span class="ace_support ace_function">${e}</span>`,
    });
    // addEventListener()
    /**
     * ace_support.ace_function
     */
    let str = params
      ?.map((p, i) => {
        for (const { regex, wrap } of rules) {
          p = p.replace(regex, wrap);
        }

        return p;
      })
      .join(', ');

    let funName = prefix;
    funName = funName.replace(
      /([a-zA-Z0-9_$]+(?=\())/,
      `<span class="ace_support ace_function">${
        prefix.startsWith('#') ? prefix.split(/[#(]/)[1] : prefix.split('(')[0]
      }</span>`,
    );
    console.log(prefix.split('(')[0]);

    for (let { regex, wrap } of rules) {
      let part = suffix.split(/[):]/).pop();
      suffix = suffix.replace(regex, wrap);
      console.log(suffix);
    }

    // Menggunakan ternary operator di dalam template literal
    const html = `${funName}${str ? `\n${str}` : ''}${suffix}`;

    console.log(str ? true : false, suffix ? true : false);

    this.signatureTooltip.innerHTML = html;

    const cursor = this.editor.renderer.textToScreenCoordinates(
      this.editor.getCursorPosition(),
    );
    const position = this.editor.session.selection.getCursor();

    const { lineHeight, $cursorLayer } = this.editor.renderer;
    const pixelPos = $cursorLayer.$pixelPos;
    // console.log(cursor1)
    const content = this.editor.renderer.content;
    const rect = content.getBoundingClientRect();
    const { left, top } = this.editor.renderer.$cursorLayer.getPixelPosition();

    // this.signatureTooltip.style.left = left / 2 + "px";
    // this.signatureTooltip.style.top = pixelPos + lineHeight + 'px';
    Object.assign(this.signatureTooltip.style, {
      top: pixelPos.top + lineHeight + 'px',
      left: left / 2 + 'px',
    });
    var offsetTop = this.editor.renderer.layerConfig.offset;

    this.signatureTooltip.style.display = 'block';
  }

  hideSignatureTooltip() {
    this.signatureTooltip.style.display = 'none';
  }

  registerTSCompleter(tools) {
    const _self = this;
    function isCursorInScriptTag(htmlContent, cursorOffset) {
      // 1. Cari semua kemunculan tag <script> hingga posisi kursor
      const scriptTagRegex =
        /<script\b[^>]*>([\s\S]*?)<\/script>|<script\b[^>]*>/gi;
      let match;
      let lastInScript = false;

      while ((match = scriptTagRegex.exec(htmlContent)) !== null) {
        const tagStart = match.index;
        const tagEnd = tagStart + match[0].length;

        // Jika kursor berada di dalam rentang tag <script>...</script> yang lengkap
        if (cursorOffset >= tagStart && cursorOffset <= tagEnd) {
          // Cek apakah ini tag pembuka yang punya atribut 'src'
          const openingTag = match[0].toLowerCase();
          if (openingTag.includes('<script') && !openingTag.includes('src=')) {
            // Cek apakah kursor benar-benar di dalam konten (setelah '>' tag pembuka)
            const openTagEnd = tagStart + openingTag.indexOf('>') + 1;
            if (cursorOffset >= openTagEnd) {
              // Jika match[1] ada, berarti tag sudah ditutup </script>
              // Kita harus pastikan kursor tidak melewati batas konten tersebut
              if (match[1] !== undefined) {
                const contentEnd = openTagEnd + match[1].length;
                return cursorOffset <= contentEnd;
              }
              return true;
            }
          }
        }

        // Safety check: jika regex menemukan tag pembuka yang belum ditutup
        if (
          cursorOffset > tagStart &&
          !match[0].toLowerCase().includes('</script>')
        ) {
          const openingTag = match[0].toLowerCase();
          if (!openingTag.includes('src=')) {
            const openTagEnd = tagStart + openingTag.indexOf('>') + 1;
            lastInScript = cursorOffset >= openTagEnd;
          }
        }
      }

      return lastInScript;
    }

    const completer = {
      getCompletions(editor, session, pos, prefix, callback) {
        const content = session.getValue();
        const offset1 = session.doc.positionToIndex(pos);

        if (!session.$modeId.includes('javascript')) return callback(null, []);
        const offset = session.doc.positionToIndex(pos);

        _self.tsWorker.postMessage({
          type: 'update',
          payload: { code: session.getValue() },
        });

        _self.tsWorker.postMessage({
          type: 'complete',
          payload: { offset },
        });

        const handler = e => {
          if (e.data.type !== 'complete') return;

          _self.tsWorker.removeEventListener('message', handler);

          var results = e.data.entries;
          var items = new Set();
          /**
           * type adalah icon jangan di tambah atau di hapus/ubah
           */
          results
            .filter(e => e.name.toLowerCase().startsWith(prefix.toLowerCase()))
            .map(e => {
              const result = {
                name: e.name,
                value: e.name,
                meta: '',
                score: 100000,
                value: e.isSnippet ? e.insertText : e.name,
              };
              // ⚡ naikkan score kalau isRecommended

              if (e.kind === 'property' || e.kind === 'setter')
                result.type = 'property';
              else if (e.kind === 'class' || e.kind === 'interface')
                result.type = 'class';
              else if (e.kind === 'parameter') result.type = 'parameter';
              else if (e.kind === 'string') result.type = 'string';
              else if (e.kind === 'method' || e.kind === 'function')
                result.type = 'function';
              else if (
                e.kind === 'var' ||
                e.kind === 'let' ||
                e.kind === 'const' ||
                e.kind === 'property'
              )
                result.type = 'property';
              else if (e.kind === 'alias') result.type = 'none';
              else result.type = 'keyword';
              items.add(result);
            });

          callback(
            null,
            [...items].sort((a, b) => a.score - b.score),
          );
        };

        _self.tsWorker.addEventListener('message', handler);
      },
      triggerCharacters: ['.', '/'],
    };

    tools.setCompleters([completer]);
  }

  async loadTSLib() {
    /*  const libs = [
      './lib/lib.es5.d.ts',
      './lib/lib.es2015.core.d.ts',
      './lib/lib.es2015.collection.d.ts',
      './lib/lib.es2015.iterable.d.ts',
      './lib/lib.es2015.promise.d.ts',
      './lib/lib.dom.d.ts',
    ];
*/
    const libs = ['./lib/lib.bundle.d.ts'];
    const loaded = await Promise.all(
      libs.map(file =>
        fetch(file)
          .then(r => r.text())
          .catch(() => ''),
      ),
    );

    this.tsLib = loaded.join('\n\n');
  }
  async initTSWorker() {
    if ('ts_worker' in gCache) {
      this.tsWorker = gCache.ts_worker;
      return;
    }
    this.tsWorker = new Worker('./ts-worker.js');
    GCache.prototype.ts_worker = this.tsWorker;
    
    await this.loadTSLib();

    this.tsWorker.postMessage({
      type: 'init',
      payload: { lib: this.tsLib },
    });
  }

  keywordCompleter = {
    getCompletions: function (editor, session, pos, prefix, callback) {
      const mode = session.$modeId;
      if (!mode.includes('javascript')) return callback(null, []);

      // keyword dipisah pakai "|"
      const keywords =
        'if|else|class|function|new|return|var|let|const|try|catch|finally|throw|switch|case|break|continue|for|while|do|import|export|default|async|await|typeof|instanceof|delete|in|of|with|void|yield|static|constructor|extends|';
      const keywordList = keywords.split('|');
      const line = session.getLine(pos.row);
      if (line.slice(0, pos.column).match(/('|"|\.)/))
        return callback(null, []);
      if (!prefix) return callback(null, []);

      // filter keyword berdasarkan prefix
      const matches = keywordList.filter(kw => kw.startsWith(prefix));

      // mapping ke format Ace
      const completions = matches.map(kw => ({
        caption: kw,
        value: kw,
        meta: kw,
        score: 15000, // tinggi biar nongol duluan
      }));

      callback(null, completions);
    },
  };

  autocompleteNativejs = {
    getCompletions: function (editor, session, pos, prefix, callback) {
      const currentMode = session.$modeId;
      if (currentMode.includes('javascript') !== true)
        return callback(null, []);
      // console.log("=== autocompleteNativejs start ===");

      const line = session.getLine(pos.row);

      // Dapatkan konten penuh dari editor
      const fullContent = session.getValue();
      const codeBefore = line.slice(0, pos.column);

      // Uji keberadaan arguments
      let context = codeBefore.startsWith('document') ? document : window;
      const props = new Set();
      while (context) {
        Object.getOwnPropertyNames(context).forEach(p => props.add(p));
        context = Object.getPrototypeOf(context);
      }

      const domEvents = [];
      for (let prop of props.values()) {
        if (prop.startsWith('on')) {
          prop = prop.replace('on', '');
          domEvents.push(prop);
        }
      }

      // ✅ case 1: tanpa string → kasih quoted
      const ifEventNoString =
        /(addEventListener|removeEventListener)\s*\(\s*([A-Za-z]*)$/;

      // ✅ case 2: sudah dalam string → kasih plain
      const ifEventWithString =
        /(addEventListener|removeEventListener)\s*\(\s*(['"])([^'"]*)$/;

      //const comma = /(\(\s*(['"]|[^'"]*)\,)/
      //console.log(comma.test(codeBefore), codeBefore, "i")

      let matchNoStr = ifEventNoString.exec(codeBefore);
      if (matchNoStr) {
        const prefix = matchNoStr[2] || '';

        const completions = domEvents.map(event => ({
          caption: `"${event}"`,
          value: `"${event}"`,
          meta: 'event',
          score: event.startsWith(prefix) ? 500000 : 200000,
          type: 'constant',
        }));

        return callback(null, completions, prefix); // ⚡ tambahkan prefix sebagai arg ketiga
      }

      // --- ada string → kasih plain
      if (ifEventWithString.test(codeBefore)) {
        return callback(
          null,
          domEvents.map(event => ({
            caption: event,
            value: event,
            meta: 'event',
            score: 250000,
            type: 'constant',
          })),
        );
      } else {
        // return callback(null, []);
      }
    },
  };
  setFontSize(size) {
    this.editor.setFontSize(size || 16);
  }

  updateEditorMaxLines = function updateEditorMaxLines() {
    const parent = this.editor.container.parentElement;
    if (!parent) return;
    this.editor.resize(true);
    const parentHeight = parent.clientHeight;
    const lineHeight = this.editor.renderer.lineHeight;
    const lines = Math.floor(parentHeight / lineHeight);
    this.editor.setOptions({ minLines: lines });
    this.editor.resize(true);
  };
}

Editor.prototype.customsnippet = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    if (!session.$modeId.includes('javascript')) return callback(null, []);
    //const el = document.createElement("a")

    const line = session.getLine(pos.row);
    const startCol = pos.column - prefix.length;
    const charBefore = startCol > 0 ? line[startCol - 1] : null;

    if (charBefore === '.' || /('|")/.test(line.slice(0, pos.column)))
      return callback(null, []);

    const snippets = [
      {
        caption: 'cl',
        snippet: 'console.log(${0})',
        meta: 'log',
        score: 99999,
      },
      {
        caption: 'cc',
        snippet: 'console.clear()${0}',
        meta: 'log',
        score: 99999,
      },
      {
        caption: 'cw',
        snippet: 'console.warn(${0})',
        meta: 'warn',
        score: 99999,
      },
      {
        caption: 'ce',
        snippet: 'console.error(${0})',
        meta: 'error',
        score: 99999,
      },
      {
        caption: 'cd',
        snippet: 'console.debug(${0})',
        meta: 'debug',
        score: 99999,
      },
      {
        caption: 'function (anon)',
        snippet: 'function() {\n\t${1}\n}',
        meta: 'snippets',
        score: 99999,
      },
      {
        caption: 'function =>',
        snippet: '() => {\n\t${1}\n}',
        meta: 'snippets',
        score: 99999,
      },

      {
        caption: 'import',
        snippet: "import {} from '${1:module}';",
        meta: 'snippets',
        score: 99999,
      },
      {
        caption: 'for (loop)',
        snippet:
          'for (let ${1:index} = ${1:0}; ${1:index} < ${2:array.length}; ${1:index}++) {\n\tconst element = ${2:array}[${1:index}]\n\n}',
        meta: 'snippets',
        score: 99999,
      },
    ];

    // for (let index = 0; index < array.length; index++) {
    //   const element = array[index];

    // }
    const filtered = snippets.filter(c => c.caption.startsWith(prefix));
    callback(null, filtered);
  },
};

export { Editor };
