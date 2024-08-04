import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as ace from "ace-builds";

@Component({
  selector: 'app-root',
  template: `
    <!--The content below is only a placeholder and can be replaced.-->
    <div class="app-ace-editor"
      #editor
      style="width: 500px;height: 250px;">
      
    </div>
    
  `,
  styles: []
})
export class AppComponent implements AfterViewInit {
  title = 'ace-angular';

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    ace.config.set("fontSize", "14px");
  //   console.log('base:', ace.config.get('basePath'));
    ace.config.set('basePath', '/assets/ace');
  //   console.log('base after:', ace.config.get('basePath'));
    ace.config.moduleUrl = (name, component) => {
      var parts = name.split("/");
      component = component || parts[parts.length - 2] || "";
  
      var sep = component == "snippets" ? "/" : "-";
      var base = parts[parts.length - 1];
      if (component == "worker" && sep == "-") {
          var re = new RegExp("^" + component + "[\\-_]|[\\-_]" + component + "$", "g");
          base = base.replace(re, "");
      }
  
      if ((!base || base == component) && parts.length > 1)
          base = parts[parts.length - 2];
      console.log('name:', name);
      console.log('component:', component);
      var path = null;
      if (path == null) {
          path = ace.config.get('basePath');
      }
      if (sep == "/") {
          component = sep = "";
      }
      if (path && path.slice(-1) != "/")
          path += "/";
      return path + component + sep + base + ace.config.get("suffix");
    };
    // not able to load worker here
    // ace.config.setModuleUrl('ace/mode/yaml', '/assets/ace/mode-yaml.js');
    // ace.config.setModuleUrl('ace/theme/twilight', '/assets/ace/theme-twilight.js');
    const aceEditor: ace.Ace.Editor = ace.edit(this.editor.nativeElement);
    // aceEditor.session.setOption('basePath', '/assets/ace');
    aceEditor.session.setValue(`
    hi:
      abc:
        test: value
      `);
    aceEditor.setTheme('ace/theme/twilight');
    aceEditor.session.setMode('ace/mode/yaml');
  }
}

