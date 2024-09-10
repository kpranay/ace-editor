import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as ace from "ace-builds";
import DataConverter from './DataConverter';

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
export class AppComponent implements OnInit, AfterViewInit {

  title = 'ace-angular';

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;

  currentDataType = 'yaml';
  data = `
hi:
  abc:
    test: value
  `;


  ngOnInit(): void {
    let output = new DataConverter()
      .fromProperties('server.port = 8080')
      .convert()
      .toYaml();

    console.log('output from properties to yaml : \n', output);

    output = new DataConverter()
      .fromProperties('server.port = 8080')
      .convert()
      .toJson();

    console.log('output from properties to json : \n', output);

    output = new DataConverter()
      .fromJson(JSON.stringify({a: {b: 1}, c: 2}))
      .convert()
      .toYaml();

    console.log('output from json to yaml : \n');
    console.log(output);


    output = new DataConverter()
      .fromYaml(this.data)
      .convert()
      .toJson();
    console.log('output from yaml to json : \n', output);

    output = new DataConverter()
      .fromYaml(this.data)
      .convert()
      .toProperties();
    console.log('output from yaml to properties : \n', output);
    output = new DataConverter()
      .fromJson(JSON.stringify({a: {b: 1}, c: 2}))
      .convert()
      .toProperties();
    console.log('output from json to properties : \n', output);
  }

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
    aceEditor.session.setValue(this.data);
    aceEditor.setTheme('ace/theme/twilight');
    aceEditor.session.setMode('ace/mode/yaml');
  }
}

