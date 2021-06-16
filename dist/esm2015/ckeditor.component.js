/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { Component, NgZone, Input, Output, EventEmitter, forwardRef, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { getEditorNamespace } from 'ckeditor4-integrations-common';
export class CKEditorComponent {
    constructor(elementRef, ngZone) {
        this.elementRef = elementRef;
        this.ngZone = ngZone;
        /**
         * CKEditor 4 script url address. Script will be loaded only if CKEDITOR namespace is missing.
         *
         * Defaults to 'https://cdn.ckeditor.com/4.16.1/standard-all/ckeditor.js'
         */
        this.editorUrl = 'https://cdn.ckeditor.com/4.16.1/full-all/ckeditor.js';
        /**
         * Tag name of the editor component.
         *
         * The default tag is `textarea`.
         */
        this.tagName = 'textarea';
        /**
         * The type of the editor interface.
         *
         * By default editor interface will be initialized as `classic` editor.
         * You can also choose to create an editor with `inline` interface type instead.
         *
         * See https://ckeditor.com/docs/ckeditor4/latest/guide/dev_uitypes.html
         * and https://ckeditor.com/docs/ckeditor4/latest/examples/fixedui.html
         * to learn more.
         */
        this.type = "classic" /* CLASSIC */;
        /**
         * Fired when the CKEDITOR https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR.html namespace
         * is loaded. It only triggers once, no matter how many CKEditor 4 components are initialised.
         * Can be used for convenient changes in the namespace, e.g. for adding external plugins.
         */
        this.namespaceLoaded = new EventEmitter();
        /**
         * Fires when the editor is ready. It corresponds with the `editor#instanceReady`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-instanceReady
         * event.
         */
        this.ready = new EventEmitter();
        /**
         * Fires when the editor data is loaded, e.g. after calling setData()
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#method-setData
         * editor's method. It corresponds with the `editor#dataReady`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-dataReady event.
         */
        this.dataReady = new EventEmitter();
        /**
         * Fires when the content of the editor has changed. It corresponds with the `editor#change`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-change
         * event. For performance reasons this event may be called even when data didn't really changed.
         * Please note that this event will only be fired when `undo` plugin is loaded. If you need to
         * listen for editor changes (e.g. for two-way data binding), use `dataChange` event instead.
         */
        this.change = new EventEmitter();
        /**
         * Fires when the content of the editor has changed. In contrast to `change` - only emits when
         * data really changed thus can be successfully used with `[data]` and two way `[(data)]` binding.
         *
         * See more: https://angular.io/guide/template-syntax#two-way-binding---
         */
        this.dataChange = new EventEmitter();
        /**
         * Fires when the native dragStart event occurs. It corresponds with the `editor#dragstart`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-dragstart
         * event.
         */
        this.dragStart = new EventEmitter();
        /**
         * Fires when the native dragEnd event occurs. It corresponds with the `editor#dragend`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-dragend
         * event.
         */
        this.dragEnd = new EventEmitter();
        /**
         * Fires when the native drop event occurs. It corresponds with the `editor#drop`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-drop
         * event.
         */
        this.drop = new EventEmitter();
        /**
         * Fires when the file loader response is received. It corresponds with the `editor#fileUploadResponse`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-fileUploadResponse
         * event.
         */
        this.fileUploadResponse = new EventEmitter();
        /**
         * Fires when the file loader should send XHR. It corresponds with the `editor#fileUploadRequest`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-fileUploadRequest
         * event.
         */
        this.fileUploadRequest = new EventEmitter();
        /**
         * Fires when the editing area of the editor is focused. It corresponds with the `editor#focus`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-focus
         * event.
         */
        this.focus = new EventEmitter();
        /**
         * Fires after the user initiated a paste action, but before the data is inserted.
         * It corresponds with the `editor#paste`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-paste
         * event.
         */
        this.paste = new EventEmitter();
        /**
         * Fires after the `paste` event if content was modified. It corresponds with the `editor#afterPaste`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-afterPaste
         * event.
         */
        this.afterPaste = new EventEmitter();
        /**
         * Fires when the editing view of the editor is blurred. It corresponds with the `editor#blur`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-blur
         * event.
         */
        this.blur = new EventEmitter();
        /**
         * If the component is read–only before the editor instance is created, it remembers that state,
         * so the editor can become read–only once it is ready.
         */
        this._readOnly = null;
        this._data = null;
        this._destroyed = false;
    }
    /**
     * Keeps track of the editor's data.
     *
     * It's also decorated as an input which is useful when not using the ngModel.
     *
     * See https://angular.io/api/forms/NgModel to learn more.
     */
    set data(data) {
        if (data === this._data) {
            return;
        }
        if (this.instance) {
            this.instance.setData(data);
            // Data may be changed by ACF.
            this._data = this.instance.getData();
            return;
        }
        this._data = data;
    }
    get data() {
        return this._data;
    }
    /**
     * When set to `true`, the editor becomes read-only.
     *
     * See https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#property-readOnly
     * to learn more.
     */
    set readOnly(isReadOnly) {
        if (this.instance) {
            this.instance.setReadOnly(isReadOnly);
            return;
        }
        // Delay setting read-only state until editor initialization.
        this._readOnly = isReadOnly;
    }
    get readOnly() {
        if (this.instance) {
            return this.instance.readOnly;
        }
        return this._readOnly;
    }
    ngAfterViewInit() {
        getEditorNamespace(this.editorUrl, namespace => {
            this.namespaceLoaded.emit(namespace);
        }).then(() => {
            // Check if component instance was destroyed before `ngAfterViewInit` call (#110).
            // Here, `this.instance` is still not initialized and so additional flag is needed.
            if (this._destroyed) {
                return;
            }
            this.ngZone.runOutsideAngular(this.createEditor.bind(this));
        }).catch(window.console.error);
    }
    ngOnDestroy() {
        this._destroyed = true;
        this.ngZone.runOutsideAngular(() => {
            if (this.instance) {
                this.instance.destroy();
                this.instance = null;
            }
        });
    }
    writeValue(value) {
        this.data = value;
    }
    registerOnChange(callback) {
        this.onChange = callback;
    }
    registerOnTouched(callback) {
        this.onTouched = callback;
    }
    createEditor() {
        const element = document.createElement(this.tagName);
        this.elementRef.nativeElement.appendChild(element);
        const instance = this.type === "inline" /* INLINE */
            ? CKEDITOR.inline(element, this.config)
            : CKEDITOR.replace(element, this.config);
        instance.once('instanceReady', evt => {
            this.instance = instance;
            // Read only state may change during instance initialization.
            this.readOnly = this._readOnly !== null ? this._readOnly : this.instance.readOnly;
            this.subscribe(this.instance);
            const undo = instance.undoManager;
            if (this.data !== null) {
                undo && undo.lock();
                instance.setData(this.data, { callback: () => {
                        // Locking undoManager prevents 'change' event.
                        // Trigger it manually to updated bound data.
                        if (this.data !== instance.getData()) {
                            undo ? instance.fire('change') : instance.fire('dataReady');
                        }
                        undo && undo.unlock();
                        this.ngZone.run(() => {
                            this.ready.emit(evt);
                        });
                    } });
            }
            else {
                this.ngZone.run(() => {
                    this.ready.emit(evt);
                });
            }
        });
    }
    subscribe(editor) {
        editor.on('focus', evt => {
            this.ngZone.run(() => {
                this.focus.emit(evt);
            });
        });
        editor.on('paste', evt => {
            this.ngZone.run(() => {
                this.paste.emit(evt);
            });
        });
        editor.on('afterPaste', evt => {
            this.ngZone.run(() => {
                this.afterPaste.emit(evt);
            });
        });
        editor.on('dragend', evt => {
            this.ngZone.run(() => {
                this.dragEnd.emit(evt);
            });
        });
        editor.on('dragstart', evt => {
            this.ngZone.run(() => {
                this.dragStart.emit(evt);
            });
        });
        editor.on('drop', evt => {
            this.ngZone.run(() => {
                this.drop.emit(evt);
            });
        });
        editor.on('fileUploadRequest', evt => {
            this.ngZone.run(() => {
                this.fileUploadRequest.emit(evt);
            });
        });
        editor.on('fileUploadResponse', evt => {
            this.ngZone.run(() => {
                this.fileUploadResponse.emit(evt);
            });
        });
        editor.on('blur', evt => {
            this.ngZone.run(() => {
                if (this.onTouched) {
                    this.onTouched();
                }
                this.blur.emit(evt);
            });
        });
        editor.on('dataReady', this.propagateChange, this);
        if (this.instance.undoManager) {
            editor.on('change', this.propagateChange, this);
        }
        // If 'undo' plugin is not loaded, listen to 'selectionCheck' event instead. (#54).
        else {
            editor.on('selectionCheck', this.propagateChange, this);
        }
    }
    propagateChange(event) {
        this.ngZone.run(() => {
            const newData = this.instance.getData();
            if (event.name === 'change') {
                this.change.emit(event);
            }
            else if (event.name === 'dataReady') {
                this.dataReady.emit(event);
            }
            if (newData === this.data) {
                return;
            }
            this._data = newData;
            this.dataChange.emit(newData);
            if (this.onChange) {
                this.onChange(newData);
            }
        });
    }
}
CKEditorComponent.decorators = [
    { type: Component, args: [{
                selector: 'ckeditor',
                template: '<ng-template></ng-template>',
                providers: [
                    {
                        provide: NG_VALUE_ACCESSOR,
                        useExisting: forwardRef(() => CKEditorComponent),
                        multi: true,
                    }
                ]
            },] }
];
CKEditorComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: NgZone }
];
CKEditorComponent.propDecorators = {
    config: [{ type: Input }],
    editorUrl: [{ type: Input }],
    tagName: [{ type: Input }],
    type: [{ type: Input }],
    data: [{ type: Input }],
    readOnly: [{ type: Input }],
    namespaceLoaded: [{ type: Output }],
    ready: [{ type: Output }],
    dataReady: [{ type: Output }],
    change: [{ type: Output }],
    dataChange: [{ type: Output }],
    dragStart: [{ type: Output }],
    dragEnd: [{ type: Output }],
    drop: [{ type: Output }],
    fileUploadResponse: [{ type: Output }],
    fileUploadRequest: [{ type: Output }],
    focus: [{ type: Output }],
    paste: [{ type: Output }],
    afterPaste: [{ type: Output }],
    blur: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2tlZGl0b3IuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NrZWRpdG9yL2NrZWRpdG9yLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0dBR0c7QUFFSCxPQUFPLEVBQ04sU0FBUyxFQUNULE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWixVQUFVLEVBQ1YsVUFBVSxFQUVWLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFFTixpQkFBaUIsRUFDakIsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQWtCbkUsTUFBTSxPQUFPLGlCQUFpQjtJQTJON0IsWUFBcUIsVUFBc0IsRUFBVSxNQUFjO1FBQTlDLGVBQVUsR0FBVixVQUFVLENBQVk7UUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBbE5uRTs7OztXQUlHO1FBQ00sY0FBUyxHQUFHLHNEQUFzRCxDQUFDO1FBRTVFOzs7O1dBSUc7UUFDTSxZQUFPLEdBQUcsVUFBVSxDQUFDO1FBRTlCOzs7Ozs7Ozs7V0FTRztRQUNNLFNBQUksMkJBQXNEO1FBb0RuRTs7OztXQUlHO1FBQ08sb0JBQWUsR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUVwRTs7OztXQUlHO1FBQ08sVUFBSyxHQUFHLElBQUksWUFBWSxFQUF1QixDQUFDO1FBRTFEOzs7OztXQUtHO1FBQ08sY0FBUyxHQUFHLElBQUksWUFBWSxFQUF1QixDQUFDO1FBRTlEOzs7Ozs7V0FNRztRQUNPLFdBQU0sR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUUzRDs7Ozs7V0FLRztRQUNPLGVBQVUsR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUUvRDs7OztXQUlHO1FBQ08sY0FBUyxHQUFHLElBQUksWUFBWSxFQUF1QixDQUFDO1FBRTlEOzs7O1dBSUc7UUFDTyxZQUFPLEdBQUcsSUFB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QUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLEdBQUcsRUFBRTtnQkFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFFLENBQUM7WUFDeEIsQ0FBQyxDQUFFLENBQUM7UUFDTCxDQUFDLENBQUUsQ0FBQztRQUVKLE1BQU0sQ0FBQyxFQUFFLENBQUUsWUFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLEdBQUcsRUFBRTtnQkFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFFLENBQUM7WUFDN0IsQ0FBQyxDQUFFLENBQUM7UUFDTCxDQUFDLENBQUUsQ0FBQztRQUVKLE1BQU0sQ0FBQyxFQUFFLENBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLEdBQUcsRUFBRTtnQkFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFFLENBQUM7WUFDMUIsQ0FBQyxDQUFFLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxFQUFFLENBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLEdBQUcsRUFBRTtnQkFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFFLENBQUM7WUFDNUIsQ0FBQyxDQUFFLENBQUM7UUFDTCxDQUFDLENBQUUsQ0FBQztRQUVKLE1BQU0sQ0FBQyxFQUFFLENBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLEdBQUcsRUFBRTtnQkFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFFLENBQUM7WUFDdkIsQ0FBQyxDQUFFLENBQUM7UUFDTCxD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U0wsS0FBSzt1QkF5QkwsS0FBSzs4QkF1QkwsTUFBTTtvQkFPTixNQUFNO3dCQVFOLE1BQU07cUJBU04sTUFBTTt5QkFRTixNQUFNO3dCQU9OLE1BQU07c0JBT04sTUFBTTttQkFPTixNQUFNO2lDQU9OLE1BQU07Z0NBT04sTUFBTTtvQkFPTixNQUFNO29CQVFOLE1BQU07eUJBT04sTUFBTTttQkFPTixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZSBDb3B5cmlnaHQgKGMpIDIwMDMtMjAyMSwgQ0tTb3VyY2UgLSBGcmVkZXJpY28gS25hYmJlbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIEZvciBsaWNlbnNpbmcsIHNlZSBMSUNFTlNFLm1kLlxuICovXG5cbmltcG9ydCB7XG5cdENvbXBvbmVudCxcblx0Tmdab25lLFxuXHRJbnB1dCxcblx0T3V0cHV0LFxuXHRFdmVudEVtaXR0ZXIsXG5cdGZvcndhcmRSZWYsXG5cdEVsZW1lbnRSZWYsXG5cdEFmdGVyVmlld0luaXQsIE9uRGVzdHJveVxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtcblx0Q29udHJvbFZhbHVlQWNjZXNzb3IsXG5cdE5HX1ZBTFVFX0FDQ0VTU09SXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcblxuaW1wb3J0IHsgZ2V0RWRpdG9yTmFtZXNwYWNlIH0gZnJvbSAnY2tlZGl0b3I0LWludGVncmF0aW9ucy1jb21tb24nO1xuXG5pbXBvcnQgeyBDS0VkaXRvcjQgfSBmcm9tICcuL2NrZWRpdG9yJztcblxuZGVjbGFyZSBsZXQgQ0tFRElUT1I6IGFueTtcblxuQENvbXBvbmVudCgge1xuXHRzZWxlY3RvcjogJ2NrZWRpdG9yJyxcblx0dGVtcGxhdGU6ICc8bmctdGVtcGxhdGU+PC9uZy10ZW1wbGF0ZT4nLFxuXG5cdHByb3ZpZGVyczogW1xuXHRcdHtcblx0XHRcdHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuXHRcdFx0dXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoICgpID0+IENLRWRpdG9yQ29tcG9uZW50ICksXG5cdFx0XHRtdWx0aTogdHJ1ZSxcblx0XHR9XG5cdF1cbn0gKVxuZXhwb3J0IGNsYXNzIENLRWRpdG9yQ29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95LCBDb250cm9sVmFsdWVBY2Nlc3NvciB7XG5cdC8qKlxuXHQgKiBUaGUgY29uZmlndXJhdGlvbiBvZiB0aGUgZWRpdG9yLlxuXHQgKlxuXHQgKiBTZWUgaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9jb25maWcuaHRtbFxuXHQgKiB0byBsZWFybiBtb3JlLlxuXHQgKi9cblx0QElucHV0KCkgY29uZmlnPzogQ0tFZGl0b3I0LkNvbmZpZztcblxuXHQvKipcblx0ICogQ0tFZGl0b3IgNCBzY3JpcHQgdXJsIGFkZHJlc3MuIFNjcmlwdCB3aWxsIGJlIGxvYWRlZCBvbmx5IGlmIENLRURJVE9SIG5hbWVzcGFjZSBpcyBtaXNzaW5nLlxuXHQgKlxuXHQgKiBEZWZhdWx0cyB0byAnaHR0cHM6Ly9jZG4uY2tlZGl0b3IuY29tLzQuMTYuMS9zdGFuZGFyZC1hbGwvY2tlZGl0b3IuanMnXG5cdCAqL1xuXHRASW5wdXQoKSBlZGl0b3JVcmwgPSAnaHR0cHM6Ly9jZG4uY2tlZGl0b3IuY29tLzQuMTYuMS9mdWxsLWFsbC9ja2VkaXRvci5qcyc7XG5cblx0LyoqXG5cdCAqIFRhZyBuYW1lIG9mIHRoZSBlZGl0b3IgY29tcG9uZW50LlxuXHQgKlxuXHQgKiBUaGUgZGVmYXVsdCB0YWcgaXMgYHRleHRhcmVhYC5cblx0ICovXG5cdEBJbnB1dCgpIHRhZ05hbWUgPSAndGV4dGFyZWEnO1xuXG5cdC8qKlxuXHQgKiBUaGUgdHlwZSBvZiB0aGUgZWRpdG9yIGludGVyZmFjZS5cblx0ICpcblx0ICogQnkgZGVmYXVsdCBlZGl0b3IgaW50ZXJmYWNlIHdpbGwgYmUgaW5pdGlhbGl6ZWQgYXMgYGNsYXNzaWNgIGVkaXRvci5cblx0ICogWW91IGNhbiBhbHNvIGNob29zZSB0byBjcmVhdGUgYW4gZWRpdG9yIHdpdGggYGlubGluZWAgaW50ZXJmYWNlIHR5cGUgaW5zdGVhZC5cblx0ICpcblx0ICogU2VlIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9ndWlkZS9kZXZfdWl0eXBlcy5odG1sXG5cdCAqIGFuZCBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvZXhhbXBsZXMvZml4ZWR1aS5odG1sXG5cdCAqIHRvIGxlYXJuIG1vcmUuXG5cdCAqL1xuXHRASW5wdXQoKSB0eXBlOiBDS0VkaXRvcjQuRWRpdG9yVHlwZSA9IENLRWRpdG9yNC5FZGl0b3JUeXBlLkNMQVNTSUM7XG5cblx0LyoqXG5cdCAqIEtlZXBzIHRyYWNrIG9mIHRoZSBlZGl0b3IncyBkYXRhLlxuXHQgKlxuXHQgKiBJdCdzIGFsc28gZGVjb3JhdGVkIGFzIGFuIGlucHV0IHdoaWNoIGlzIHVzZWZ1bCB3aGVuIG5vdCB1c2luZyB0aGUgbmdNb2RlbC5cblx0ICpcblx0ICogU2VlIGh0dHBzOi8vYW5ndWxhci5pby9hcGkvZm9ybXMvTmdNb2RlbCB0byBsZWFybiBtb3JlLlxuXHQgKi9cblx0QElucHV0KCkgc2V0IGRhdGEoIGRhdGE6IHN0cmluZyApIHtcblx0XHRpZiAoIGRhdGEgPT09IHRoaXMuX2RhdGEgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLmluc3RhbmNlICkge1xuXHRcdFx0dGhpcy5pbnN0YW5jZS5zZXREYXRhKCBkYXRhICk7XG5cdFx0XHQvLyBEYXRhIG1heSBiZSBjaGFuZ2VkIGJ5IEFDRi5cblx0XHRcdHRoaXMuX2RhdGEgPSB0aGlzLmluc3RhbmNlLmdldERhdGEoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9kYXRhID0gZGF0YTtcblx0fVxuXG5cdGdldCBkYXRhKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMuX2RhdGE7XG5cdH1cblxuXHQvKipcblx0ICogV2hlbiBzZXQgdG8gYHRydWVgLCB0aGUgZWRpdG9yIGJlY29tZXMgcmVhZC1vbmx5LlxuXHQgKlxuXHQgKiBTZWUgaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNwcm9wZXJ0eS1yZWFkT25seVxuXHQgKiB0byBsZWFybiBtb3JlLlxuXHQgKi9cblx0QElucHV0KCkgc2V0IHJlYWRPbmx5KCBpc1JlYWRPbmx5OiBib29sZWFuICkge1xuXHRcdGlmICggdGhpcy5pbnN0YW5jZSApIHtcblx0XHRcdHRoaXMuaW5zdGFuY2Uuc2V0UmVhZE9ubHkoIGlzUmVhZE9ubHkgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBEZWxheSBzZXR0aW5nIHJlYWQtb25seSBzdGF0ZSB1bnRpbCBlZGl0b3IgaW5pdGlhbGl6YXRpb24uXG5cdFx0dGhpcy5fcmVhZE9ubHkgPSBpc1JlYWRPbmx5O1xuXHR9XG5cblx0Z2V0IHJlYWRPbmx5KCk6IGJvb2xlYW4ge1xuXHRcdGlmICggdGhpcy5pbnN0YW5jZSApIHtcblx0XHRcdHJldHVybiB0aGlzLmluc3RhbmNlLnJlYWRPbmx5O1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9yZWFkT25seTtcblx0fVxuXG5cdC8qKlxuXHQgKiBGaXJlZCB3aGVuIHRoZSBDS0VESVRPUiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SLmh0bWwgbmFtZXNwYWNlXG5cdCAqIGlzIGxvYWRlZC4gSXQgb25seSB0cmlnZ2VycyBvbmNlLCBubyBtYXR0ZXIgaG93IG1hbnkgQ0tFZGl0b3IgNCBjb21wb25lbnRzIGFyZSBpbml0aWFsaXNlZC5cblx0ICogQ2FuIGJlIHVzZWQgZm9yIGNvbnZlbmllbnQgY2hhbmdlcyBpbiB0aGUgbmFtZXNwYWNlLCBlLmcuIGZvciBhZGRpbmcgZXh0ZXJuYWwgcGx1Z2lucy5cblx0ICovXG5cdEBPdXRwdXQoKSBuYW1lc3BhY2VMb2FkZWQgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIGVkaXRvciBpcyByZWFkeS4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNpbnN0YW5jZVJlYWR5YFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWluc3RhbmNlUmVhZHlcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgcmVhZHkgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIGVkaXRvciBkYXRhIGlzIGxvYWRlZCwgZS5nLiBhZnRlciBjYWxsaW5nIHNldERhdGEoKVxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI21ldGhvZC1zZXREYXRhXG5cdCAqIGVkaXRvcidzIG1ldGhvZC4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNkYXRhUmVhZHlgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtZGF0YVJlYWR5IGV2ZW50LlxuXHQgKi9cblx0QE91dHB1dCgpIGRhdGFSZWFkeSA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgY29udGVudCBvZiB0aGUgZWRpdG9yIGhhcyBjaGFuZ2VkLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2NoYW5nZWBcblx0ICogaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNldmVudC1jaGFuZ2Vcblx0ICogZXZlbnQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHRoaXMgZXZlbnQgbWF5IGJlIGNhbGxlZCBldmVuIHdoZW4gZGF0YSBkaWRuJ3QgcmVhbGx5IGNoYW5nZWQuXG5cdCAqIFBsZWFzZSBub3RlIHRoYXQgdGhpcyBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgd2hlbiBgdW5kb2AgcGx1Z2luIGlzIGxvYWRlZC4gSWYgeW91IG5lZWQgdG9cblx0ICogbGlzdGVuIGZvciBlZGl0b3IgY2hhbmdlcyAoZS5nLiBmb3IgdHdvLXdheSBkYXRhIGJpbmRpbmcpLCB1c2UgYGRhdGFDaGFuZ2VgIGV2ZW50IGluc3RlYWQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgY2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyB3aGVuIHRoZSBjb250ZW50IG9mIHRoZSBlZGl0b3IgaGFzIGNoYW5nZWQuIEluIGNvbnRyYXN0IHRvIGBjaGFuZ2VgIC0gb25seSBlbWl0cyB3aGVuXG5cdCAqIGRhdGEgcmVhbGx5IGNoYW5nZWQgdGh1cyBjYW4gYmUgc3VjY2Vzc2Z1bGx5IHVzZWQgd2l0aCBgW2RhdGFdYCBhbmQgdHdvIHdheSBgWyhkYXRhKV1gIGJpbmRpbmcuXG5cdCAqXG5cdCAqIFNlZSBtb3JlOiBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvdGVtcGxhdGUtc3ludGF4I3R3by13YXktYmluZGluZy0tLVxuXHQgKi9cblx0QE91dHB1dCgpIGRhdGFDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIG5hdGl2ZSBkcmFnU3RhcnQgZXZlbnQgb2NjdXJzLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2RyYWdzdGFydGBcblx0ICogaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNldmVudC1kcmFnc3RhcnRcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgZHJhZ1N0YXJ0ID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyB3aGVuIHRoZSBuYXRpdmUgZHJhZ0VuZCBldmVudCBvY2N1cnMuIEl0IGNvcnJlc3BvbmRzIHdpdGggdGhlIGBlZGl0b3IjZHJhZ2VuZGBcblx0ICogaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNldmVudC1kcmFnZW5kXG5cdCAqIGV2ZW50LlxuXHQgKi9cblx0QE91dHB1dCgpIGRyYWdFbmQgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIG5hdGl2ZSBkcm9wIGV2ZW50IG9jY3Vycy4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNkcm9wYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWRyb3Bcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgZHJvcCA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgZmlsZSBsb2FkZXIgcmVzcG9uc2UgaXMgcmVjZWl2ZWQuIEl0IGNvcnJlc3BvbmRzIHdpdGggdGhlIGBlZGl0b3IjZmlsZVVwbG9hZFJlc3BvbnNlYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWZpbGVVcGxvYWRSZXNwb25zZVxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBmaWxlVXBsb2FkUmVzcG9uc2UgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIGZpbGUgbG9hZGVyIHNob3VsZCBzZW5kIFhIUi4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNmaWxlVXBsb2FkUmVxdWVzdGBcblx0ICogaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNldmVudC1maWxlVXBsb2FkUmVxdWVzdFxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBmaWxlVXBsb2FkUmVxdWVzdCA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgZWRpdGluZyBhcmVhIG9mIHRoZSBlZGl0b3IgaXMgZm9jdXNlZC4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNmb2N1c2Bcblx0ICogaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNldmVudC1mb2N1c1xuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBmb2N1cyA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgYWZ0ZXIgdGhlIHVzZXIgaW5pdGlhdGVkIGEgcGFzdGUgYWN0aW9uLCBidXQgYmVmb3JlIHRoZSBkYXRhIGlzIGluc2VydGVkLlxuXHQgKiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI3Bhc3RlYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LXBhc3RlXG5cdCAqIGV2ZW50LlxuXHQgKi9cblx0QE91dHB1dCgpIHBhc3RlID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyBhZnRlciB0aGUgYHBhc3RlYCBldmVudCBpZiBjb250ZW50IHdhcyBtb2RpZmllZC4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNhZnRlclBhc3RlYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWFmdGVyUGFzdGVcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgYWZ0ZXJQYXN0ZSA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgZWRpdGluZyB2aWV3IG9mIHRoZSBlZGl0b3IgaXMgYmx1cnJlZC4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNibHVyYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWJsdXJcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgYmx1ciA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogQSBjYWxsYmFjayBleGVjdXRlZCB3aGVuIHRoZSBjb250ZW50IG9mIHRoZSBlZGl0b3IgY2hhbmdlcy4gUGFydCBvZiB0aGVcblx0ICogYENvbnRyb2xWYWx1ZUFjY2Vzc29yYCAoaHR0cHM6Ly9hbmd1bGFyLmlvL2FwaS9mb3Jtcy9Db250cm9sVmFsdWVBY2Nlc3NvcikgaW50ZXJmYWNlLlxuXHQgKlxuXHQgKiBOb3RlOiBVbnNldCB1bmxlc3MgdGhlIGNvbXBvbmVudCB1c2VzIHRoZSBgbmdNb2RlbGAuXG5cdCAqL1xuXHRvbkNoYW5nZT86ICggZGF0YTogc3RyaW5nICkgPT4gdm9pZDtcblxuXHQvKipcblx0ICogQSBjYWxsYmFjayBleGVjdXRlZCB3aGVuIHRoZSBlZGl0b3IgaGFzIGJlZW4gYmx1cnJlZC4gUGFydCBvZiB0aGVcblx0ICogYENvbnRyb2xWYWx1ZUFjY2Vzc29yYCAoaHR0cHM6Ly9hbmd1bGFyLmlvL2FwaS9mb3Jtcy9Db250cm9sVmFsdWVBY2Nlc3NvcikgaW50ZXJmYWNlLlxuXHQgKlxuXHQgKiBOb3RlOiBVbnNldCB1bmxlc3MgdGhlIGNvbXBvbmVudCB1c2VzIHRoZSBgbmdNb2RlbGAuXG5cdCAqL1xuXHRvblRvdWNoZWQ/OiAoKSA9PiB2b2lkO1xuXG5cdC8qKlxuXHQgKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIGVkaXRvciBjcmVhdGVkIGJ5IHRoaXMgY29tcG9uZW50LlxuXHQgKi9cblx0aW5zdGFuY2U6IGFueTtcblxuXHQvKipcblx0ICogSWYgdGhlIGNvbXBvbmVudCBpcyByZWFk4oCTb25seSBiZWZvcmUgdGhlIGVkaXRvciBpbnN0YW5jZSBpcyBjcmVhdGVkLCBpdCByZW1lbWJlcnMgdGhhdCBzdGF0ZSxcblx0ICogc28gdGhlIGVkaXRvciBjYW4gYmVjb21lIHJlYWTigJNvbmx5IG9uY2UgaXQgaXMgcmVhZHkuXG5cdCAqL1xuXHRwcml2YXRlIF9yZWFkT25seTogYm9vbGVhbiA9IG51bGw7XG5cblx0cHJpdmF0ZSBfZGF0YTogc3RyaW5nID0gbnVsbDtcblxuXHRwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3RvciggcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLCBwcml2YXRlIG5nWm9uZTogTmdab25lICkge31cblxuXHRuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG5cdFx0Z2V0RWRpdG9yTmFtZXNwYWNlKCB0aGlzLmVkaXRvclVybCwgbmFtZXNwYWNlID0+IHtcblx0XHRcdHRoaXMubmFtZXNwYWNlTG9hZGVkLmVtaXQoIG5hbWVzcGFjZSApO1xuXHRcdH0gKS50aGVuKCAoKSA9PiB7XG5cdFx0XHQvLyBDaGVjayBpZiBjb21wb25lbnQgaW5zdGFuY2Ugd2FzIGRlc3Ryb3llZCBiZWZvcmUgYG5nQWZ0ZXJWaWV3SW5pdGAgY2FsbCAoIzExMCkuXG5cdFx0XHQvLyBIZXJlLCBgdGhpcy5pbnN0YW5jZWAgaXMgc3RpbGwgbm90IGluaXRpYWxpemVkIGFuZCBzbyBhZGRpdGlvbmFsIGZsYWcgaXMgbmVlZGVkLlxuXHRcdFx0aWYgKCB0aGlzLl9kZXN0cm95ZWQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoIHRoaXMuY3JlYXRlRWRpdG9yLmJpbmQoIHRoaXMgKSApO1xuXHRcdH0gKS5jYXRjaCggd2luZG93LmNvbnNvbGUuZXJyb3IgKTtcblx0fVxuXG5cdG5nT25EZXN0cm95KCk6IHZvaWQge1xuXHRcdHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG5cblx0XHR0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhciggKCkgPT4ge1xuXHRcdFx0aWYgKCB0aGlzLmluc3RhbmNlICkge1xuXHRcdFx0XHR0aGlzLmluc3RhbmNlLmRlc3Ryb3koKTtcblx0XHRcdFx0dGhpcy5pbnN0YW5jZSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9XG5cblx0d3JpdGVWYWx1ZSggdmFsdWU6IHN0cmluZyApOiB2b2lkIHtcblx0XHR0aGlzLmRhdGEgPSB2YWx1ZTtcblx0fVxuXG5cdHJlZ2lzdGVyT25DaGFuZ2UoIGNhbGxiYWNrOiAoIGRhdGE6IHN0cmluZyApID0+IHZvaWQgKTogdm9pZCB7XG5cdFx0dGhpcy5vbkNoYW5nZSA9IGNhbGxiYWNrO1xuXHR9XG5cblx0cmVnaXN0ZXJPblRvdWNoZWQoIGNhbGxiYWNrOiAoKSA9PiB2b2lkICk6IHZvaWQge1xuXHRcdHRoaXMub25Ub3VjaGVkID0gY2FsbGJhY2s7XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUVkaXRvcigpOiB2b2lkIHtcblx0XHRjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggdGhpcy50YWdOYW1lICk7XG5cdFx0dGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQoIGVsZW1lbnQgKTtcblxuXHRcdGNvbnN0IGluc3RhbmNlOiBDS0VkaXRvcjQuRWRpdG9yID0gdGhpcy50eXBlID09PSBDS0VkaXRvcjQuRWRpdG9yVHlwZS5JTkxJTkVcblx0XHRcdD8gQ0tFRElUT1IuaW5saW5lKCBlbGVtZW50LCB0aGlzLmNvbmZpZyApXG5cdFx0XHQ6IENLRURJVE9SLnJlcGxhY2UoIGVsZW1lbnQsIHRoaXMuY29uZmlnICk7XG5cblx0XHRpbnN0YW5jZS5vbmNlKCAnaW5zdGFuY2VSZWFkeScsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG5cblx0XHRcdC8vIFJlYWQgb25seSBzdGF0ZSBtYXkgY2hhbmdlIGR1cmluZyBpbnN0YW5jZSBpbml0aWFsaXphdGlvbi5cblx0XHRcdHRoaXMucmVhZE9ubHkgPSB0aGlzLl9yZWFkT25seSAhPT0gbnVsbCA/IHRoaXMuX3JlYWRPbmx5IDogdGhpcy5pbnN0YW5jZS5yZWFkT25seTtcblxuXHRcdFx0dGhpcy5zdWJzY3JpYmUoIHRoaXMuaW5zdGFuY2UgKTtcblxuXHRcdFx0Y29uc3QgdW5kbyA9IGluc3RhbmNlLnVuZG9NYW5hZ2VyO1xuXG5cdFx0XHRpZiAoIHRoaXMuZGF0YSAhPT0gbnVsbCApIHtcblx0XHRcdFx0dW5kbyAmJiB1bmRvLmxvY2soKTtcblxuXHRcdFx0XHRpbnN0YW5jZS5zZXREYXRhKCB0aGlzLmRhdGEsIHsgY2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0XHQvLyBMb2NraW5nIHVuZG9NYW5hZ2VyIHByZXZlbnRzICdjaGFuZ2UnIGV2ZW50LlxuXHRcdFx0XHRcdC8vIFRyaWdnZXIgaXQgbWFudWFsbHkgdG8gdXBkYXRlZCBib3VuZCBkYXRhLlxuXHRcdFx0XHRcdGlmICggdGhpcy5kYXRhICE9PSBpbnN0YW5jZS5nZXREYXRhKCkgKSB7XG5cdFx0XHRcdFx0XHR1bmRvID8gaW5zdGFuY2UuZmlyZSggJ2NoYW5nZScgKSA6IGluc3RhbmNlLmZpcmUoICdkYXRhUmVhZHknICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHVuZG8gJiYgdW5kby51bmxvY2soKTtcblxuXHRcdFx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5yZWFkeS5lbWl0KCBldnQgKTtcblx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdH0gfSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5yZWFkeS5lbWl0KCBldnQgKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fVxuXG5cdHByaXZhdGUgc3Vic2NyaWJlKCBlZGl0b3I6IGFueSApOiB2b2lkIHtcblx0XHRlZGl0b3Iub24oICdmb2N1cycsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0dGhpcy5mb2N1cy5lbWl0KCBldnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHRlZGl0b3Iub24oICdwYXN0ZScsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0dGhpcy5wYXN0ZS5lbWl0KCBldnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHRlZGl0b3Iub24oICdhZnRlclBhc3RlJywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmFmdGVyUGFzdGUuZW1pdCggZXZ0ICk7XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdFx0ZWRpdG9yLm9uKCAnZHJhZ2VuZCcsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0dGhpcy5kcmFnRW5kLmVtaXQoIGV2dCApO1xuXHRcdFx0fSApO1xuXHRcdH0pO1xuXG5cdFx0ZWRpdG9yLm9uKCAnZHJhZ3N0YXJ0JywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmRyYWdTdGFydC5lbWl0KCBldnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHRlZGl0b3Iub24oICdkcm9wJywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmRyb3AuZW1pdCggZXZ0ICk7XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdFx0ZWRpdG9yLm9uKCAnZmlsZVVwbG9hZFJlcXVlc3QnLCBldnQgPT4ge1xuXHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuZmlsZVVwbG9hZFJlcXVlc3QuZW1pdChldnQpO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblxuXHRcdGVkaXRvci5vbiggJ2ZpbGVVcGxvYWRSZXNwb25zZScsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0dGhpcy5maWxlVXBsb2FkUmVzcG9uc2UuZW1pdChldnQpO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblxuXHRcdGVkaXRvci5vbiggJ2JsdXInLCBldnQgPT4ge1xuXHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdGlmICggdGhpcy5vblRvdWNoZWQgKSB7XG5cdFx0XHRcdFx0dGhpcy5vblRvdWNoZWQoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuYmx1ci5lbWl0KCBldnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHRlZGl0b3Iub24oICdkYXRhUmVhZHknLCB0aGlzLnByb3BhZ2F0ZUNoYW5nZSwgdGhpcyApO1xuXG5cdFx0aWYgKCB0aGlzLmluc3RhbmNlLnVuZG9NYW5hZ2VyICkge1xuXHRcdFx0ZWRpdG9yLm9uKCAnY2hhbmdlJywgdGhpcy5wcm9wYWdhdGVDaGFuZ2UsIHRoaXMgKTtcblx0XHR9XG5cdFx0Ly8gSWYgJ3VuZG8nIHBsdWdpbiBpcyBub3QgbG9hZGVkLCBsaXN0ZW4gdG8gJ3NlbGVjdGlvbkNoZWNrJyBldmVudCBpbnN0ZWFkLiAoIzU0KS5cblx0XHRlbHNlIHtcblx0XHRcdGVkaXRvci5vbiggJ3NlbGVjdGlvbkNoZWNrJywgdGhpcy5wcm9wYWdhdGVDaGFuZ2UsIHRoaXMgKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHByb3BhZ2F0ZUNoYW5nZSggZXZlbnQ6IGFueSApOiB2b2lkIHtcblx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdGNvbnN0IG5ld0RhdGEgPSB0aGlzLmluc3RhbmNlLmdldERhdGEoKTtcblxuXHRcdFx0aWYgKCBldmVudC5uYW1lID09PSAnY2hhbmdlJyApIHtcblx0XHRcdFx0dGhpcy5jaGFuZ2UuZW1pdCggZXZlbnQgKTtcblx0XHRcdH0gZWxzZSBpZiAoIGV2ZW50Lm5hbWUgPT09ICdkYXRhUmVhZHknICkge1xuXHRcdFx0XHR0aGlzLmRhdGFSZWFkeS5lbWl0KCBldmVudCApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIG5ld0RhdGEgPT09IHRoaXMuZGF0YSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9kYXRhID0gbmV3RGF0YTtcblx0XHRcdHRoaXMuZGF0YUNoYW5nZS5lbWl0KCBuZXdEYXRhICk7XG5cblx0XHRcdGlmICggdGhpcy5vbkNoYW5nZSApIHtcblx0XHRcdFx0dGhpcy5vbkNoYW5nZSggbmV3RGF0YSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fVxuXG59XG4iXX0=