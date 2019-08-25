import * as alt from 'alt';
import * as native from 'natives';
import * as panelsPanelStatus from 'client/panels/panelstatus.mjs';

export const pages = {
  inventory: 'http://resources/orp/client/html/inventory/index.html',
  atm: 'http://resources/orp/client/html/atm/index.html',
  vehicleCustomization: 'http://resources/orp/client/html/vehicleCustoms/index.html'
}

export class WebView {

  events = [];
  ready = false;

  constructor(page, showCursor = true) {
    if (!pages[page]) {
      throw new Error('Invalid Page');
    }

    this.page = page;
    if (panelsPanelStatus.isAnyPanelOpen()) return;
    alt.emit('panel:SetStatus', this.page, true);
    
    this.view = new alt.WebView(pages[this.page]);
    this.view.focus();
    alt.showCursor(showCursor);

    this.view.on('close', this.close.bind(null, this));
    this.view.on('ready', this.dialogReady.bind(this));
    alt.on('update', this.disableControls);
    alt.toggleGameControls(false);

    alt.log(JSON.stringify(this.view.events));
  }

  // This is called to add webview function calls, it stores them in a class array allowing us
  // to dynamically loop through them and clean them up on webview close.
  on(name, func) {
    this.events.push({
      name,
      func,
    });

    const index = this.events.length - 1;
    this.view.on(this.events[index].name, this.events[index].func.bind(this));
  }

  // This calls webview.emit()
  emit(ref, name, value) {
    if (!ref || !ref.view) return;
    ref.view.emit(name, value);
  }

  // This function requires a reference to the class instance
  // For internal calls, we bind `this` into the first argument slot
  // For external calls, we pass our WebView class reference
  close(ref) {
    if (!ref || !ref.view) return;
    ref.view.off('close', ref.close);

    if (ref.events.length) {
      ref.events.forEach(e => {
        ref.view.off(e.name, e.func);
      });
    }

    ref.view.unfocus();
    ref.view.destroy();
    ref.view = undefined;
    alt.showCursor(false);
    alt.off('update', ref.disableControls);
    alt.toggleGameControls(true);
    alt.emit('panel:SetStatus', ref.page, false);
  }

  dialogReady() {
    this.ready = true;
  }

  disableControls() {
    native.disableControlAction(0, 24, true);
    native.disableControlAction(0, 25, true);
  }
}
