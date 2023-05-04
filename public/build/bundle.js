
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var fluide = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function compute_slots(slots) {
        const result = {};
        for (const key in slots) {
            result[key] = true;
        }
        return result;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
                // make sure an initial resize event is fired _after_ the iframe is loaded (which is asynchronous)
                // see https://github.com/sveltejs/svelte/issues/4233
                fn();
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Schedules a callback to run immediately before the component is updated after any state change.
     *
     * The first time the callback runs will be before the initial `onMount`
     *
     * https://svelte.dev/docs#run-time-svelte-beforeupdate
     */
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    /**
     * Associates an arbitrary `context` object with the current component and the specified `key`
     * and returns that object. The context is then available to children of the component
     * (including slotted content) with `getContext`.
     *
     * Like lifecycle functions, this must be called during component initialisation.
     *
     * https://svelte.dev/docs#run-time-svelte-setcontext
     */
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    /**
     * Retrieves the context that belongs to the closest parent component with the specified `key`.
     * Must be called during component initialisation.
     *
     * https://svelte.dev/docs#run-time-svelte-getcontext
     */
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.58.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    function createStore() {
        const data = new Map();
        const { subscribe, set, update } = writable(data);
        const store = {
            subscribe,
            set,
            update,
            add: (item, key) => {
                update((currentData) => {
                    currentData.set(key, item);
                    return currentData;
                });
                return data;
            },
            get: (key) => {
                return data.get(key) || null;
            },
            getAll: () => {
                return Array.from(data.values());
            },
            delete: (key) => {
                let deleted = false;
                update((currentData) => {
                    currentData.delete(key);
                    deleted = true;
                    return currentData;
                });
                return deleted;
            },
            count: () => data.size
        };
        return store;
    }
    function createEdgeStore() {
        const data = new Map();
        const { subscribe, set, update } = writable(data);
        const store = {
            subscribe,
            set,
            update,
            add: (item, key) => {
                if (typeof key !== 'string') {
                    const elements = Array.from(key);
                    const anchor1 = elements[0];
                    const anchor2 = elements[1];
                    anchor1.connected.update((anchors) => anchors.add(anchor2));
                    anchor2.connected.update((anchors) => anchors.add(anchor1));
                    if (store.match(...Array.from(key)).length)
                        return;
                }
                update((currentData) => {
                    currentData.set(key, item);
                    return currentData;
                });
                return;
            },
            getAll: () => {
                return Array.from(data.values());
            },
            get: (key) => {
                return data.get(key) || null;
            },
            match: (...args) => {
                return Array.from(data.keys()).filter((key) => {
                    if (key === 'cursor')
                        return false;
                    return args.every((arg) => {
                        if (!arg)
                            return true;
                        return key.has(arg);
                    });
                });
            },
            delete: (key) => {
                if (typeof key !== 'string') {
                    const elements = Array.from(key);
                    const anchor1 = elements[0];
                    const anchor2 = elements[1];
                    anchor1.connected.update((anchors) => {
                        anchors.delete(anchor2);
                        return anchors;
                    });
                    anchor2.connected.update((anchors) => {
                        anchors.delete(anchor1);
                        return anchors;
                    });
                }
                let deleted = false;
                update((currentData) => {
                    currentData.delete(key);
                    deleted = true;
                    return currentData;
                });
                return deleted;
            },
            count: () => data.size
        };
        return store;
    }

    function createNode(userNode) {
        const { id, inputs, outputs, resizable, dimensions, editable, direction, zIndex, position, selectionColor, borderWidth, edge } = userNode;
        const { bgColor, borderColor, rotation, borderRadius, connections, textColor, locked, group } = userNode;
        const anchorStore = createStore();
        const recalculateAnchors = (direction = 'self') => {
            get_store_value(anchorStore).forEach((anchor) => {
                if (direction === 'self' || get_store_value(anchor.direction) === direction) {
                    anchor.recalculatePosition();
                }
            });
        };
        const nodeKey = typeof id === 'string' && id.slice(0, 2) === 'N-' ? id : `N-${id}`;
        const newNode = {
            id: nodeKey,
            position: writable({
                x: position?.x || 0,
                y: position?.y || 0
            }),
            dimensions: {
                width: writable(dimensions?.width || 0),
                height: writable(dimensions?.height || dimensions?.width)
            },
            group: writable(group || null),
            locked: writable(locked || false),
            selectable: writable(true),
            inputs: writable(inputs),
            outputs: writable(outputs),
            connectable: writable(true),
            deletable: writable(true),
            recalculateAnchors,
            rotation: writable(rotation || 0),
            hideable: writable(true),
            moving: writable(false),
            resizingWidth: writable(false),
            resizingHeight: writable(false),
            rotating: writable(false),
            focusable: writable(true),
            editable: writable(editable || false),
            resizable: writable(resizable),
            anchors: anchorStore,
            zIndex: writable(zIndex || 2),
            ariaLabel: `Node ${id}`,
            collapsed: writable(false),
            edge: edge || null,
            visible: writable(true),
            collapsible: writable(true),
            borderRadius: writable(borderRadius),
            bgColor: writable(bgColor || null),
            direction: writable(direction),
            label: writable(userNode.label || ''),
            borderColor: writable(borderColor || null),
            borderWidth: writable(borderWidth),
            selectionColor: writable(selectionColor || null),
            textColor: writable(textColor || null),
            connections: writable(connections)
        };
        return newNode;
    }

    const EDGE_LABEL_BORDER_RADIUS = 10;
    const EDGE_LABEL_WIDTH = 100;
    const EDGE_LABEL_HEIGHT = 50;
    const EDGE_LABEL_COLOR = '#000';
    const EDGE_LABEL_TEXT_COLOR = '#fff';
    const EDGE_LABEL_FONT_SIZE = '12px';
    const GRID_SCALE = 22;
    const DOT_WIDTH = 1.4;
    const stepBuffer = 40;

    function sortEdgeKey(keyOne, keyTwo) {
        // Sort the strings alphabetically
        const sortedStrings = [keyOne, keyTwo].sort();
        // Concatenate the sorted strings
        const combinedString = `${sortedStrings[0]}+${sortedStrings[1]}`;
        return combinedString;
    }

    function createEdge(connection, component, config) {
        const { source, target } = connection;
        const edgeId = source.id && target.id ? sortEdgeKey(source.id, target.id) : 'cursor';
        const writableEdge = {
            id: edgeId,
            target: connection.target,
            source: connection.source,
            component,
            type: writable(config?.type || null),
            color: config?.color || writable(null),
            width: writable(config?.width || 0),
            animated: writable(config?.animated || false)
        };
        // if (config?.raiseEdges) writableEdge.raiseEdgeOnSelect = true;
        // if (config?.edgesAbove) writableEdge.edgesAbove = true;
        if (config?.disconnect)
            writableEdge.disconnect = true;
        if (config?.label) {
            const baseLabel = {
                text: writable(config?.label.text),
                color: writable(config?.label?.color || EDGE_LABEL_COLOR),
                textColor: writable(config?.label?.textColor || EDGE_LABEL_TEXT_COLOR),
                fontSize: writable(config?.label?.fontSize || EDGE_LABEL_FONT_SIZE),
                dimensions: {
                    width: writable(config?.label.dimensions?.width || EDGE_LABEL_WIDTH),
                    height: writable(config?.label.dimensions?.height || EDGE_LABEL_HEIGHT)
                },
                borderRadius: writable(config?.label.borderRadius || EDGE_LABEL_BORDER_RADIUS)
            };
            writableEdge.label = baseLabel;
        }
        return writableEdge;
    }

    // Calculate the distance between two touches (used for pinch-zoom)
    function getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getRandomColor() {
        const random255 = () => Math.floor(Math.random() * 256);
        const r = random255();
        const g = random255();
        const b = random255();
        return `rgb(${r},${g},${b})`;
    }

    const shapeRef = {
        '(': 'round',
        '([': 'stadium',
        '[[': 'subroutine',
        '[(': 'cylindrical',
        '((': 'circle',
        '{': 'rhombus',
        '{{': 'hexagon'
    };
    const edgeRef = { '-': 'straight', '~': 'bezier' };
    const bracketRef = { '(': ')', '[': ']', '{': '}' };
    const edgeRegex = /[-=~]*>(?:\s*\|(.+?)\|)?/g;
    const flowChartParser = (mermaid) => {
        const lines = mermaid.split('\n');
        const flowChart = { parentNodes: [], nodeList: {} };
        // parse mermaid string line by line
        for (const line of lines) {
            const { parentNodes, childNodes, edge } = parseLine(line);
            for (const parentNode of parentNodes) {
                // if a parent or child exists in our flow chart, then we add to their respective parent and child node arrays, otherwise we add their relational nodes then add to the flow chart
                if (!flowChart.nodeList[parentNode.id])
                    flowChart.parentNodes.push(parentNode);
                for (const childNode of childNodes) {
                    if (flowChart.nodeList[parentNode.id]) {
                        if (flowChart.nodeList[childNode.id] &&
                            flowChart.nodeList[childNode.id].children.some(({ node }) => node.id === parentNode.id)) {
                            throw new Error('Circular reference detected');
                        }
                        flowChart.nodeList[parentNode.id].children.push({
                            node: flowChart.nodeList[childNode.id] || childNode,
                            ...edge
                        });
                    }
                    else {
                        parentNode.children.push({
                            node: flowChart.nodeList[childNode.id] || childNode,
                            ...edge
                        });
                        flowChart.nodeList[parentNode.id] = parentNode;
                    }
                    if (flowChart.nodeList[childNode.id])
                        flowChart.nodeList[childNode.id].parents.push({
                            node: flowChart.nodeList[parentNode.id] || parentNode
                        });
                    else {
                        childNode.parents.push({ node: flowChart.nodeList[parentNode.id] || parentNode });
                        flowChart.nodeList[childNode.id] = childNode;
                    }
                    // remove any of the child nodes being added as a top level parent node
                    flowChart.parentNodes = flowChart.parentNodes.filter((node) => node.id !== childNode.id);
                }
            }
        }
        return flowChart;
    };
    const parseLine = (line) => {
        const parentNodes = [];
        const childNodes = [];
        const trimmedLine = line.trim();
        let edgeString = '';
        // regex here will match any edge type along with its content if provided. that edge is then used to split the line into parent and child nodes
        const edgeStringArray = trimmedLine.match(edgeRegex);
        if (edgeStringArray)
            edgeString = edgeStringArray[0];
        else
            throw new Error('Invalid edge');
        const [parentNodesString, childNodesString] = trimmedLine.split(edgeString);
        for (const parentNode of parentNodesString.split('&'))
            parentNodes.push(nodeParser(parentNode));
        for (const childNode of childNodesString.split('&'))
            childNodes.push(nodeParser(childNode));
        const edge = edgeParser(edgeString);
        return { parentNodes, childNodes, edge };
    };
    const nodeParser = (node) => {
        node = node.trim();
        let id = '';
        let shape = '';
        const data = { shape: '' };
        const bracketStack = [];
        const elements = node.split('|');
        const label = elements[0];
        let type = elements[1];
        const props = elements[2];
        for (let i = 0; i < label.length; i++) {
            if (isOpenBracket(label[i]))
                bracketStack.push(label[i]);
            else if (bracketRef[bracketStack[bracketStack.length - 1]] === label[i]) {
                shape = shapeRef[bracketStack.join('')];
                break;
            }
            else
                id += label[i];
        }
        if (!shape)
            shape = 'default';
        data.shape = shape;
        if (!type)
            type = 'Default';
        if (!props)
            data.content = id;
        else
            data.props = props;
        return { id, data, type, children: [], parents: [], depth: 0, nesting: 0 };
    };
    const edgeParser = (edge) => {
        edge = edge.trim();
        let shape = '';
        const [edgeLine, content] = edge.split('|');
        const key = edgeLine[0];
        if (key in edgeRef)
            shape = edgeRef[key];
        else
            throw new Error('Not a valid edge type');
        if (content)
            return { shape, content: content.trim(), length: Math.floor((edgeLine.trim().length - 1) / 2) };
        else
            return { shape, length: Math.floor((edgeLine.trim().length - 1) / 2) };
    };
    function isOpenBracket(key) {
        return key in bracketRef;
    }

    function generateKey() {
        return Math.random().toString(36).substring(7);
    }

    function roundNum(number, decimalPlaces = 1) {
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(number * factor) / factor;
    }

    function buildArcStringKey(a, b) {
        const aX = Math.sign(a.x).toString();
        const aY = Math.sign(a.y).toString();
        const bX = Math.sign(b.x).toString();
        const bY = Math.sign(b.y).toString();
        return `${aX}${aY}${bX}${bY}`;
    }

    function constructArcString(cornerRadius, key) {
        const arcStrings = {
            '1001': `a ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} ${cornerRadius}`,
            '0110': `a ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} ${cornerRadius}`,
            '100-1': `a ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} -${cornerRadius}`,
            '0-110': `a ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} -${cornerRadius}`,
            '-1001': `a ${cornerRadius} ${cornerRadius} 0 0 0 -${cornerRadius} ${cornerRadius}`,
            '01-10': `a ${cornerRadius} ${cornerRadius} 0 0 1 -${cornerRadius} ${cornerRadius}`,
            '-100-1': `a ${cornerRadius} ${cornerRadius} 0 0 1 -${cornerRadius} -${cornerRadius}`,
            '0-1-10': `a ${cornerRadius} ${cornerRadius} 0 0 0 -${cornerRadius} -${cornerRadius}`
        };
        return arcStrings[key] || '';
    }

    function rotateVector(vector, angle) {
        // Convert angle from degrees to radians
        const angleInRadians = angle * (Math.PI / 180);
        // Calculate rotated vector
        const rotatedX = vector.x * Math.cos(angleInRadians) - vector.y * Math.sin(angleInRadians);
        const rotatedY = vector.x * Math.sin(angleInRadians) + vector.y * Math.cos(angleInRadians);
        // Return rotated vector as an object with x and y properties
        return { x: rotatedX, y: rotatedY };
    }

    const buildPath = (string, xStep, yStep, arcString) => string + ` l ${xStep} ${yStep} ` + arcString;

    // This gets updated on user click
    // Value is relative to the scale/translation of the particular graph
    // It's updated via the derived cursor store on every graph
    const initialClickPosition = writable({ x: 0, y: 0 });
    const touchDistance = writable(0);
    const tracking = writable(false);
    // This is a global store/event listener for the raw cursor position
    // This can be refined
    const cursorPositionRaw = readable({ x: 0, y: 0 }, (set) => {
        const updateCursorPosition = (e) => {
            set({ x: e.clientX, y: e.clientY });
        };
        const updateTouchPosition = (e) => {
            if (e.touches.length === 2) {
                const distance = getTouchDistance(e.touches[0], e.touches[1]);
                touchDistance.set(distance);
                const touchPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                set(touchPoint);
            }
            else if (e.touches.length === 1) {
                const x = e.touches[0].clientX;
                const y = e.touches[0].clientY;
                const touchPoint = { x, y };
                set(touchPoint);
                tracking.set(true);
            }
        };
        const onTouchStart = (e) => {
            updateTouchPosition(e);
            window.addEventListener('touchend', onTouchEnd);
            window.addEventListener('touchmove', updateTouchPosition);
        };
        const onTouchEnd = () => {
            tracking.set(false);
            touchDistance.set(0);
            window.removeEventListener('touchmove', updateTouchPosition);
        };
        window.addEventListener('mousemove', updateCursorPosition);
        window.addEventListener('touchstart', onTouchStart, true);
        return () => {
            window.removeEventListener('mousemove', updateCursorPosition);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', updateTouchPosition);
            window.removeEventListener('touchend', onTouchEnd);
        };
    });

    function calculateFitContentWidth(element) {
        element.style.width = 'fit-content';
        element.style.height = 'fit-content';
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        return [width, height];
    }

    function calculateTranslation(oldScale, newScale, currentTranslation, pointerPosition, dimensions) {
        const newTranslation = { x: 0, y: 0 };
        // Calculate the cursor position relative to the wrapper
        const pointerXRelativeToWrapper = pointerPosition.x - dimensions.left - dimensions.width / 2;
        const pointerYRelativeToWrapper = pointerPosition.y - dimensions.top - dimensions.height / 2;
        // Calculate the cursor position relative to the scaled content
        const pointerXRelativeToContent = (pointerXRelativeToWrapper - currentTranslation.x) / oldScale;
        const pointerYRelativeToContent = (pointerYRelativeToWrapper - currentTranslation.y) / oldScale;
        // Update the offsets based on the cursor position and the scale value
        newTranslation.x = pointerXRelativeToWrapper - pointerXRelativeToContent * newScale;
        newTranslation.y = pointerYRelativeToWrapper - pointerYRelativeToContent * newScale;
        return newTranslation;
    }

    const MAX_ZOOM = 3;
    const MIN_ZOOM = 0.1;

    const directionVectors = {
        north: { x: 0, y: -1 },
        south: { x: 0, y: 1 },
        east: { x: 1, y: 0 },
        west: { x: -1, y: 0 },
        self: { x: 0, y: 0 }
    };

    function calculateZoom(scale, delta, zoomIncrement) {
        const scaleAdjustment = delta * zoomIncrement;
        const newScale = scale - scaleAdjustment;
        return Number(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale)).toFixed(9));
    }

    const calculateRelativeCursor = (e, top, left, width, height, scale, translation) => {
        const { clientX, clientY } = e;
        const scaleCapture = scale;
        const xRelativeToWrapper = clientX - left;
        const yRelativeToWrapper = clientY - top;
        const xOffsetDueToTranslation = translation.x;
        const yOffsetDueToTranslation = translation.y;
        const xOffsetDuetToScale = (width * (1 - scale)) / 2;
        const yOffsetDuetToScale = (height * (1 - scale)) / 2;
        const newX = xRelativeToWrapper - xOffsetDueToTranslation - xOffsetDuetToScale;
        const newY = yRelativeToWrapper - yOffsetDueToTranslation - yOffsetDuetToScale;
        const newCursorX = newX / scaleCapture;
        const newCursorY = newY / scaleCapture;
        return { x: newCursorX, y: newCursorY };
    };
    function calculateRelativePosition(dimensions, transforms, position) {
        const { top, left, width, height } = get_store_value(dimensions);
        const scale = get_store_value(transforms.scale);
        const translation = get_store_value(transforms.translation);
        const scaled = calculateRelativeCursor({ clientX: position.x, clientY: position.y }, top, left, width, height, scale, translation);
        return { scaled, scale };
    }

    function updateTranslation(initialClickPosition, currentCursorPosition, transforms) {
        const { scale, translation } = transforms;
        const scaleValue = get_store_value(scale);
        const graphTranslation = get_store_value(translation);
        const deltaX = currentCursorPosition.x - initialClickPosition.x;
        const deltaY = currentCursorPosition.y - initialClickPosition.y;
        const newTranslationX = graphTranslation.x + deltaX * scaleValue;
        const newTranslationY = graphTranslation.y + deltaY * scaleValue;
        return { x: newTranslationX, y: newTranslationY };
    }

    function calculateDotProduct(vector1, vector2) {
        const product = vector1.x * vector2.x + vector1.y * vector2.y;
        return product;
    }
    // This can absolutley be optimized
    function calculateStepPath(source, target, buffer) {
        const steps = [];
        const deltaX = target.x - source.x;
        const deltaY = target.y - source.y;
        const sameDirection = areVectorsEqual(source.direction, target.direction);
        const orthogonal = calculateDotProduct(source.direction, target.direction) === 0;
        const crossing = areCrossing(source, target);
        const oppositeSource = multiply(source.direction, -1, -1);
        const oppositeTarget = multiply(target.direction, -1, -1);
        const perpendicularSource = { x: Math.abs(source.direction.y), y: Math.abs(source.direction.x) };
        const sourceDirectionDelta = multiply(source.direction, deltaX - buffer * source.direction.x * (orthogonal ? 1 : sameDirection ? 0 : 2), deltaY - buffer * source.direction.y * (orthogonal ? 1 : sameDirection ? 0 : 2));
        const targetDirectionDelta = multiply(target.direction, deltaX + buffer * target.direction.x * (orthogonal ? 1 : sameDirection ? 0 : 2), deltaY + buffer * target.direction.y * (orthogonal ? 1 : sameDirection ? 0 : 2));
        const sourceReaching = Math.sign(sourceDirectionDelta.x) === -1 || Math.sign(sourceDirectionDelta.y) === -1;
        const targetReaching = Math.sign(targetDirectionDelta.x) === 1 || Math.sign(targetDirectionDelta.y) === 1;
        const absoluteX = Math.abs(deltaX);
        const absoluteY = Math.abs(deltaY);
        const sourceBuffer = multiply(source.direction, buffer, buffer);
        const oppositeTargetBuffer = multiply(oppositeTarget, buffer, buffer);
        const targetBuffer = multiply(target.direction, buffer, buffer);
        const fullSource = multiply(source.direction, absoluteX, absoluteY);
        const fullTarget = multiply(oppositeTarget, absoluteX, absoluteY);
        const halfSource = multiply(source.direction, absoluteX / 2, absoluteY / 2);
        const halfTarget = multiply(oppositeTarget, absoluteX / 2, absoluteY / 2);
        const fullDelta = multiply(perpendicularSource, deltaX, deltaY);
        const sourceFacingTarget = !crossing && !targetReaching && !sourceReaching;
        const sourceToXBuffer = source.x + sourceBuffer.x;
        const sourceToYBuffer = source.y + sourceBuffer.y;
        const targetToXBuffer = target.x + targetBuffer.x;
        const targetToYBuffer = target.y + targetBuffer.y;
        if (sourceReaching)
            steps.push(sourceBuffer);
        if (crossing && !targetReaching && !sourceReaching) {
            steps.push(fullSource);
            steps.push(fullTarget);
        }
        else if (sameDirection) {
            if (!sourceReaching) {
                steps.push(multiply(source.direction, buffer + absoluteX, buffer + absoluteY));
            }
            steps.push(fullDelta);
            if (!targetReaching) {
                steps.push(multiply(oppositeTarget, buffer + absoluteX, buffer + absoluteY));
            }
        }
        else if (sourceFacingTarget) {
            steps.push(halfSource);
            steps.push(fullDelta);
            steps.push(halfTarget);
        }
        else if (sourceReaching && targetReaching) {
            if (orthogonal) {
                const xReach = Math.abs(sourceToXBuffer - targetToXBuffer);
                const yReach = Math.abs(sourceToYBuffer - targetToYBuffer);
                steps.push(multiply(target.direction, absoluteX < buffer * 2
                    ? target.direction.x * (deltaX + target.direction.x * buffer)
                    : absoluteX + buffer, absoluteY < buffer * 2
                    ? target.direction.y * (deltaY + target.direction.y * buffer)
                    : absoluteY + buffer));
                steps.push(multiply(oppositeSource, xReach, yReach));
            }
            else {
                const xReach = Math.abs(sourceToXBuffer - targetToXBuffer);
                const yReach = Math.abs(sourceToYBuffer - targetToYBuffer);
                steps.push(multiply(perpendicularSource, deltaX / 2, deltaY / 2));
                steps.push(multiply(target.direction, xReach, yReach));
                steps.push(multiply(perpendicularSource, deltaX / 2, deltaY / 2));
            }
        }
        else if (sourceReaching) {
            const xReach = Math.abs(sourceToXBuffer - target.x);
            const yReach = Math.abs(sourceToYBuffer - target.y);
            steps.push(multiply(oppositeTarget, absoluteX < buffer * 2 ? absoluteX - buffer : absoluteX / 2, absoluteY < buffer * 2 ? absoluteY - buffer : absoluteY / 2));
            steps.push(multiply(oppositeSource, xReach, yReach));
            steps.push(multiply(oppositeTarget, Math.max(buffer, absoluteX / 2), Math.max(buffer, absoluteY / 2)));
        }
        else if (targetReaching) {
            const xReach = Math.abs(targetToXBuffer - source.x);
            const yReach = Math.abs(targetToYBuffer - source.y);
            steps.push(multiply(source.direction, Math.max(buffer, absoluteX / 2), Math.max(buffer, absoluteY / 2)));
            steps.push(multiply(target.direction, xReach, yReach));
            steps.push(multiply(source.direction, absoluteX < buffer * 2 ? absoluteX - buffer : absoluteX / 2, absoluteY < buffer * 2 ? absoluteY - buffer : absoluteY / 2));
        }
        if (targetReaching) {
            steps.push(oppositeTargetBuffer);
        }
        return steps;
    }
    function areCrossing(vec1, vec2) {
        const { x: dx1, y: dy1 } = vec1.direction;
        const { x: dx2, y: dy2 } = vec2.direction;
        const deltaX = vec2.x - vec1.x;
        const deltaY = vec2.y - vec1.y;
        if (dx1 * dy2 === dx2 * dy1)
            return false;
        return ((Math.sign(deltaY) === Math.sign(dy1 + dy2)) !== (Math.sign(deltaX) === Math.sign(dx1 + dx2)));
    }
    function multiply(vector, deltaX, deltaY) {
        return { x: vector.x * deltaX, y: vector.y * deltaY };
    }
    function areVectorsEqual(vector1, vector2) {
        return vector1.x === vector2.x && vector1.y === vector2.y;
    }

    function calculateFitView(dimensions, bounds) {
        const { width, height } = dimensions;
        const { top, left, right, bottom } = bounds;
        const boundsWidth = right - left;
        const boundsHeight = bottom - top;
        if (!boundsWidth || !boundsHeight)
            return { x: null, y: null, scale: null };
        const centerX = left + boundsWidth / 2;
        const centerY = top + boundsHeight / 2;
        const scale = Math.min(width / boundsWidth, height / boundsHeight) * 0.8;
        const viewportCenterX = width / 2;
        const viewportCenterY = height / 2;
        const translateX = viewportCenterX - centerX;
        const translateY = viewportCenterY - centerY;
        return {
            x: translateX * scale,
            y: translateY * scale,
            scale: scale
        };
    }

    const calculateRadius = (value1, value2, cornerRadius) => Math.min(Math.abs(value1 || value2) / 2, cornerRadius);

    function calculatePath(path) {
        const pathLength = path.getTotalLength();
        const halfLength = pathLength / 2;
        return path.getPointAtLength(halfLength);
    }

    function createDerivedCursorStore(cursorPositionRaw, dimensions, translation, scale) {
        const cursorPosition = derived([cursorPositionRaw, dimensions, translation, scale], ([$cursorPositionRaw, $dimensions, $translation, $scale]) => {
            const e = {
                clientX: $cursorPositionRaw.x,
                clientY: $cursorPositionRaw.y
            };
            return calculateRelativeCursor(e, $dimensions.top, $dimensions.left, $dimensions.width, $dimensions.height, $scale, $translation);
        });
        return cursorPosition;
    }

    function createBoundsStore(nodes, dimensions, scale, translation) {
        const top = writable(Infinity);
        const left = writable(Infinity);
        const right = writable(-Infinity);
        const bottom = writable(-Infinity);
        const nodeBounds = writable({
            top: Infinity,
            left: Infinity,
            right: -Infinity,
            bottom: -Infinity
        });
        let animationFrame;
        let graphDimensions = get_store_value(dimensions);
        let graphScale = get_store_value(scale);
        let graphTranslation = get_store_value(translation);
        let graphWidth = graphDimensions.width / graphScale;
        let graphHeight = graphDimensions.height / graphScale;
        function recalculateBounds() {
            // This calculates the top left corner of the graph element
            // As if the "window" is being project on the graph itself
            // We are using a function that is not tailored for this and it should be refactored
            const { x: graphLeft, y: graphTop } = calculateRelativeCursor({ clientX: graphDimensions.left, clientY: graphDimensions.top }, graphDimensions.top, graphDimensions.left, graphDimensions.width, graphDimensions.height, graphScale, graphTranslation);
            const currentNodeBounds = get_store_value(nodeBounds);
            top.set(Math.min(currentNodeBounds.top, graphTop));
            left.set(Math.min(currentNodeBounds.left, graphLeft));
            right.set(Math.max(currentNodeBounds.right, graphLeft + graphWidth));
            bottom.set(Math.max(currentNodeBounds.bottom, graphHeight + graphTop));
        }
        function recalculateNodeBounds(tracking = false) {
            let newTop = Infinity;
            let newLeft = Infinity;
            let newRight = -Infinity;
            let newBottom = -Infinity;
            for (const node of nodes.getAll()) {
                const { x, y } = get_store_value(node.position);
                const width = get_store_value(node.dimensions.width);
                const height = get_store_value(node.dimensions.height);
                newLeft = Math.min(newLeft, x);
                newTop = Math.min(newTop, y);
                newRight = Math.max(newRight, x + width);
                newBottom = Math.max(newBottom, y + height);
            }
            nodeBounds.set({ top: newTop, left: newLeft, right: newRight, bottom: newBottom });
            recalculateBounds();
            if (tracking)
                animationFrame = requestAnimationFrame(() => recalculateNodeBounds(tracking));
        }
        nodes.subscribe((nodes) => {
            recalculateNodeBounds();
            for (const node of nodes.values()) {
                node.dimensions.width.subscribe(() => {
                    recalculateNodeBounds();
                });
                node.dimensions.height.subscribe(() => {
                    recalculateNodeBounds();
                });
            }
        });
        tracking.subscribe((tracking) => {
            if (tracking)
                recalculateNodeBounds(tracking);
            if (!tracking)
                cancelAnimationFrame(animationFrame);
        });
        dimensions.subscribe(() => {
            graphDimensions = get_store_value(dimensions);
            graphWidth = graphDimensions.width / graphScale;
            graphHeight = graphDimensions.height / graphScale;
            recalculateBounds();
        });
        scale.subscribe(() => {
            graphScale = get_store_value(scale);
            graphWidth = graphDimensions.width / graphScale;
            graphHeight = graphDimensions.height / graphScale;
            recalculateBounds();
        });
        translation.subscribe(() => {
            graphTranslation = get_store_value(translation);
            recalculateBounds();
        });
        return { top, left, right, bottom, nodeBounds };
    }

    function calculateViewportCenter(dimensions, translation, scale) {
        const { width, height, top, left } = dimensions;
        const viewportCenter = { clientX: width / 2, clientY: height / 2 };
        return calculateRelativeCursor(viewportCenter, top, left, width, height, scale, translation);
    }

    function createGraph(id, config) {
        const { zoom, editable, translation: initialTranslation, direction, locked, edge } = config;
        const translation = writable({
            x: initialTranslation?.x || 0,
            y: initialTranslation?.y || 0
        });
        const dimensions = writable({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 });
        const scale = writable(zoom);
        const nodes = createStore();
        const bounds = createBoundsStore(nodes, dimensions, scale, translation);
        const center = derived([dimensions, translation, scale], ([$dimensions, $translation, $scale]) => {
            return calculateViewportCenter($dimensions, $translation, $scale);
        });
        const graph = {
            id,
            nodes,
            edges: createEdgeStore(),
            transforms: {
                translation,
                scale
            },
            maxZIndex: writable(2),
            dimensions,
            bounds,
            center,
            direction: direction || 'LR',
            editable: editable || false,
            edge: edge || null,
            editing: writable(null),
            cursor: createDerivedCursorStore(cursorPositionRaw, dimensions, translation, scale),
            locked: writable(locked || false),
            groups: writable({
                selected: { parent: writable(null), nodes: writable(new Set()) },
                hidden: { parent: writable(null), nodes: writable(new Set()) }
            }),
            groupBoxes: createStore(),
            activeGroup: writable(null),
            initialNodePositions: writable([])
        };
        return graph;
    }

    function generateOutput(inputs, processor) {
        const outputStore = writable();
        const updateOutputStore = () => {
            const inputValues = get_store_value(inputs);
            const currentInputs = {};
            for (const key in inputValues) {
                currentInputs[key] = get_store_value(inputValues[key]);
            }
            outputStore.set(processor(currentInputs));
        };
        const unsubscribeFns = [];
        const subscribeToNestedStores = (store) => {
            for (const key in store) {
                store[key].subscribe(() => {
                    updateOutputStore();
                });
            }
        };
        const unsubscribeInputs = inputs.subscribe((wrappedInputs) => {
            unsubscribeFns.forEach((fn) => fn());
            unsubscribeFns.length = 0;
            subscribeToNestedStores(wrappedInputs);
        });
        return {
            subscribe: outputStore.subscribe,
            unsubscribe: () => {
                unsubscribeInputs();
                unsubscribeFns.forEach((fn) => fn());
            },
            set: null,
            update: null
        };
    }

    const graphStore = createStore();

    const buffer$1 = 10;
    function captureGroup(group) {
        const groupSet = get_store_value(group);
        const groupArray = Array.from(groupSet);
        return groupArray.map((node) => {
            return get_store_value(node.position);
        });
    }
    function moveNodes(graph, snapTo) {
        let animationFrame;
        const groups = get_store_value(graph.groups);
        const groupName = get_store_value(graph.activeGroup);
        if (!groupName)
            return;
        const nodeGroup = groups[groupName].nodes;
        if (!nodeGroup)
            return;
        const initialPositions = get_store_value(graph.initialNodePositions);
        const { x: initialClickX, y: initialClickY } = get_store_value(initialClickPosition);
        const nodeGroupArray = Array.from(get_store_value(nodeGroup));
        const groupBoxes = get_store_value(graph.groupBoxes);
        nodeGroupArray.forEach((node) => node.moving.set(true));
        moveGroup();
        function moveGroup() {
            const cursorPosition = get_store_value(graph.cursor);
            let newX = cursorPosition.x - initialClickX;
            let newY = cursorPosition.y - initialClickY;
            if (snapTo) {
                newX -= newX % snapTo;
                newY -= newY % snapTo;
            }
            const delta = { x: newX, y: newY };
            nodeGroupArray.forEach((node, index) => {
                const { group, position } = node;
                const initialPosition = initialPositions[index];
                let groupBox;
                if (groupName === 'selected') {
                    const localGroupName = get_store_value(group);
                    if (localGroupName)
                        groupBox = groupBoxes.get(localGroupName);
                }
                if (!groupBox) {
                    moveElement(initialPosition, delta, position);
                }
                else {
                    const nodeWidth = get_store_value(node.dimensions.width);
                    const nodeHeight = get_store_value(node.dimensions.height);
                    const bounds = calculateRelativeBounds(groupBox, nodeWidth, nodeHeight);
                    moveElementWithBounds(initialPosition, delta, position, bounds);
                }
            });
            if (get_store_value(tracking)) {
                animationFrame = requestAnimationFrame(moveGroup);
            }
            else {
                cancelAnimationFrame(animationFrame);
            }
        }
    }
    function moveElement(initialPosition, delta, position) {
        position.set({
            x: initialPosition.x + delta.x,
            y: initialPosition.y + delta.y
        });
    }
    function moveElementWithBounds(initialPosition, delta, position, bounds) {
        position.set({
            x: Math.min(Math.max(bounds.left, initialPosition.x + delta.x), bounds.right),
            y: Math.min(Math.max(bounds.top, initialPosition.y + delta.y), bounds.bottom)
        });
    }
    function calculateRelativeBounds(groupBox, nodeWidth, nodeHeight) {
        const { x: groupBoxX, y: groupBoxY } = get_store_value(groupBox.position);
        return {
            left: groupBoxX + buffer$1,
            right: groupBoxX + get_store_value(groupBox.dimensions.width) - nodeWidth - buffer$1,
            top: groupBoxY + buffer$1,
            bottom: groupBoxY + get_store_value(groupBox.dimensions.height) - nodeHeight - buffer$1
        };
    }

    function zoomAndTranslate(direction = 1, dimensions, transforms, increment = 0.1) {
        const graphDimensions = get_store_value(dimensions);
        const { width, height, top, left } = graphDimensions;
        const scaleStore = transforms.scale;
        const graphTranslation = get_store_value(transforms.translation);
        const scale = get_store_value(scaleStore);
        const newScale = calculateZoom(scale, direction, increment);
        const newTranslation = calculateTranslation(scale, newScale, graphTranslation, { x: width / 2 + left, y: height / 2 + top }, graphDimensions);
        scaleStore.set(newScale);
        transforms.translation.set(newTranslation);
    }

    function createAnchor(graph, node, id, position, dimensions, store, edge, type, direction, dynamic, key, edgeColor) {
        const { width, height } = dimensions;
        const { x, y } = position;
        // Create stores for the anchor offset values
        const nodePosition = get_store_value(node.position);
        const offset = writable({
            x: x - nodePosition.x + width / 2,
            y: y - nodePosition.y + height / 2
        });
        // Create derived stores for the anchor X and Y positions based on the node position and the offset
        const anchorPosition = derived([node.position, offset], ([$position, $offset]) => {
            return { x: $position.x + $offset.x, y: $position.y + $offset.y };
        });
        const transforms = graph.transforms;
        const graphDimensions = graph.dimensions;
        const directionStore = writable(direction || 'self');
        const recalculatePosition = () => {
            const anchorElement = document.getElementById(id);
            const direction = get_store_value(directionStore);
            const vector = directionVectors[direction];
            if (!anchorElement)
                return;
            const { x, y, width, height } = anchorElement.getBoundingClientRect();
            const oldOffset = get_store_value(offset);
            const oldPosition = get_store_value(anchorPosition);
            const { scaled, scale } = calculateRelativePosition(graphDimensions, transforms, { x, y });
            const deltaX = scaled.x - oldPosition.x;
            const deltaY = scaled.y - oldPosition.y;
            offset.set({
                x: oldOffset.x + deltaX + width / scale / 2 + (vector.x * width) / scale / 2,
                y: oldOffset.y + deltaY + height / scale / 2 + (vector.y * height) / scale / 2
            });
        };
        // Moving s derived from whether or not the parent node is moving or resizing
        const moving = derived([node.moving, node.resizingWidth, node.resizingHeight, node.rotating], ([$moving, $resizingWidth, $resizingHeight, $rotating]) => {
            return $moving || $resizingWidth || $resizingHeight || $rotating;
        });
        const rotation = derived([node.rotation], ([$rotation]) => $rotation);
        return {
            id,
            position: anchorPosition,
            offset,
            direction: directionStore,
            dynamic: writable(dynamic || false),
            type,
            edge,
            moving,
            mounted: writable(false),
            recalculatePosition,
            connected: writable(new Set()),
            store: store || null,
            inputKey: key || null,
            edgeColor: edgeColor || writable(null),
            rotation,
            node
        };
    }

    function reloadStore(store) {
        const object = JSON.parse(store);
        const graph = createGraph(object.id, {
            ...object,
            initialZoom: object.transforms.scale
        });
        Object.entries(object.nodes).forEach(([id, node]) => {
            const nodeProps = node;
            const newNode = createNode(nodeProps);
            Object.entries(node.anchors).forEach(([id, anchor]) => {
                const newAnchor = createAnchor(newNode, id, anchor.position, { width: 0, height: 0 }, anchor.input, anchor.direction, anchor.dynamic);
                newNode.anchors.add(newAnchor, id);
            });
            graph.nodes.add(newNode, id);
        });
        Object.entries(object.edges).forEach(([id, edge]) => {
            graph.edges.add(edge, id);
        });
        return graph;
    }

    /* node_modules/svelvet/dist/components/Anchor/DefaultAnchor.svelte generated by Svelte v3.58.0 */

    const file$l = "node_modules/svelvet/dist/components/Anchor/DefaultAnchor.svelte";

    function create_fragment$s(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelvet-anchor svelte-19t6skv");
    			toggle_class(div, "output", /*output*/ ctx[0]);
    			toggle_class(div, "input", /*input*/ ctx[1]);
    			toggle_class(div, "connected", /*connected*/ ctx[3]);
    			toggle_class(div, "connecting", /*connecting*/ ctx[2]);
    			toggle_class(div, "hovering", /*hovering*/ ctx[4]);
    			set_style(div, "--prop-anchor-color", /*bgColor*/ ctx[5]);
    			add_location(div, file$l, 8, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*output*/ 1) {
    				toggle_class(div, "output", /*output*/ ctx[0]);
    			}

    			if (dirty & /*input*/ 2) {
    				toggle_class(div, "input", /*input*/ ctx[1]);
    			}

    			if (dirty & /*connected*/ 8) {
    				toggle_class(div, "connected", /*connected*/ ctx[3]);
    			}

    			if (dirty & /*connecting*/ 4) {
    				toggle_class(div, "connecting", /*connecting*/ ctx[2]);
    			}

    			if (dirty & /*hovering*/ 16) {
    				toggle_class(div, "hovering", /*hovering*/ ctx[4]);
    			}

    			if (dirty & /*bgColor*/ 32) {
    				set_style(div, "--prop-anchor-color", /*bgColor*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DefaultAnchor', slots, []);
    	let { output } = $$props;
    	let { input } = $$props;
    	let { connecting } = $$props;
    	let { connected } = $$props;
    	let { hovering } = $$props;
    	let { bgColor } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (output === undefined && !('output' in $$props || $$self.$$.bound[$$self.$$.props['output']])) {
    			console.warn("<DefaultAnchor> was created without expected prop 'output'");
    		}

    		if (input === undefined && !('input' in $$props || $$self.$$.bound[$$self.$$.props['input']])) {
    			console.warn("<DefaultAnchor> was created without expected prop 'input'");
    		}

    		if (connecting === undefined && !('connecting' in $$props || $$self.$$.bound[$$self.$$.props['connecting']])) {
    			console.warn("<DefaultAnchor> was created without expected prop 'connecting'");
    		}

    		if (connected === undefined && !('connected' in $$props || $$self.$$.bound[$$self.$$.props['connected']])) {
    			console.warn("<DefaultAnchor> was created without expected prop 'connected'");
    		}

    		if (hovering === undefined && !('hovering' in $$props || $$self.$$.bound[$$self.$$.props['hovering']])) {
    			console.warn("<DefaultAnchor> was created without expected prop 'hovering'");
    		}

    		if (bgColor === undefined && !('bgColor' in $$props || $$self.$$.bound[$$self.$$.props['bgColor']])) {
    			console.warn("<DefaultAnchor> was created without expected prop 'bgColor'");
    		}
    	});

    	const writable_props = ['output', 'input', 'connecting', 'connected', 'hovering', 'bgColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DefaultAnchor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('output' in $$props) $$invalidate(0, output = $$props.output);
    		if ('input' in $$props) $$invalidate(1, input = $$props.input);
    		if ('connecting' in $$props) $$invalidate(2, connecting = $$props.connecting);
    		if ('connected' in $$props) $$invalidate(3, connected = $$props.connected);
    		if ('hovering' in $$props) $$invalidate(4, hovering = $$props.hovering);
    		if ('bgColor' in $$props) $$invalidate(5, bgColor = $$props.bgColor);
    	};

    	$$self.$capture_state = () => ({
    		output,
    		input,
    		connecting,
    		connected,
    		hovering,
    		bgColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('output' in $$props) $$invalidate(0, output = $$props.output);
    		if ('input' in $$props) $$invalidate(1, input = $$props.input);
    		if ('connecting' in $$props) $$invalidate(2, connecting = $$props.connecting);
    		if ('connected' in $$props) $$invalidate(3, connected = $$props.connected);
    		if ('hovering' in $$props) $$invalidate(4, hovering = $$props.hovering);
    		if ('bgColor' in $$props) $$invalidate(5, bgColor = $$props.bgColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [output, input, connecting, connected, hovering, bgColor];
    }

    class DefaultAnchor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {
    			output: 0,
    			input: 1,
    			connecting: 2,
    			connected: 3,
    			hovering: 4,
    			bgColor: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefaultAnchor",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get output() {
    		throw new Error("<DefaultAnchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set output(value) {
    		throw new Error("<DefaultAnchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get input() {
    		throw new Error("<DefaultAnchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input(value) {
    		throw new Error("<DefaultAnchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get connecting() {
    		throw new Error("<DefaultAnchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set connecting(value) {
    		throw new Error("<DefaultAnchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get connected() {
    		throw new Error("<DefaultAnchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set connected(value) {
    		throw new Error("<DefaultAnchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hovering() {
    		throw new Error("<DefaultAnchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hovering(value) {
    		throw new Error("<DefaultAnchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<DefaultAnchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<DefaultAnchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Anchor/Anchor.svelte generated by Svelte v3.58.0 */
    const file$k = "node_modules/svelvet/dist/components/Anchor/Anchor.svelte";

    const get_default_slot_changes$4 = dirty => ({
    	linked: dirty[0] & /*$connectedAnchors*/ 256,
    	hovering: dirty[0] & /*hovering*/ 512,
    	connecting: dirty[0] & /*connecting*/ 1024
    });

    const get_default_slot_context$4 = ctx => ({
    	linked: /*$connectedAnchors*/ ctx[8]?.size >= 1,
    	hovering: /*hovering*/ ctx[9],
    	connecting: /*connecting*/ ctx[10]
    });

    // (402:2) {#if !invisible}
    function create_if_block$c(ctx) {
    	let defaultanchor;
    	let current;

    	defaultanchor = new DefaultAnchor({
    			props: {
    				output: /*output*/ ctx[2],
    				input: /*input*/ ctx[1],
    				connecting: /*connecting*/ ctx[10],
    				hovering: /*hovering*/ ctx[9],
    				bgColor: /*bgColor*/ ctx[0],
    				connected: /*$connectedAnchors*/ ctx[8]?.size >= 1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(defaultanchor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(defaultanchor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const defaultanchor_changes = {};
    			if (dirty[0] & /*output*/ 4) defaultanchor_changes.output = /*output*/ ctx[2];
    			if (dirty[0] & /*input*/ 2) defaultanchor_changes.input = /*input*/ ctx[1];
    			if (dirty[0] & /*connecting*/ 1024) defaultanchor_changes.connecting = /*connecting*/ ctx[10];
    			if (dirty[0] & /*hovering*/ 512) defaultanchor_changes.hovering = /*hovering*/ ctx[9];
    			if (dirty[0] & /*bgColor*/ 1) defaultanchor_changes.bgColor = /*bgColor*/ ctx[0];
    			if (dirty[0] & /*$connectedAnchors*/ 256) defaultanchor_changes.connected = /*$connectedAnchors*/ ctx[8]?.size >= 1;
    			defaultanchor.$set(defaultanchor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defaultanchor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defaultanchor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(defaultanchor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(402:2) {#if !invisible}",
    		ctx
    	});

    	return block;
    }

    // (401:69)    
    function fallback_block$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*invisible*/ ctx[5] && create_if_block$c(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*invisible*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*invisible*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$c(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$3.name,
    		type: "fallback",
    		source: "(401:69)    ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let div;
    	let div_id_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[47].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[46], get_default_slot_context$4);
    	const default_slot_or_fallback = default_slot || fallback_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(div, "id", div_id_value = /*anchor*/ ctx[7]?.id);
    			attr_dev(div, "class", "anchor-wrapper svelte-r2gbwj");
    			toggle_class(div, "locked", /*locked*/ ctx[4]);
    			add_location(div, file$k, 390, 0, 11362);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div, null);
    			}

    			/*div_binding*/ ctx[50](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[48], false, false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[49], false, false, false, false),
    					listen_dev(div, "mousedown", stop_propagation(prevent_default(/*handleClick*/ ctx[21])), false, true, true, false),
    					listen_dev(div, "mouseup", stop_propagation(/*handleMouseUp*/ ctx[20]), false, false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$connectedAnchors, hovering, connecting*/ 1792 | dirty[1] & /*$$scope*/ 32768)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[46],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[46])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[46], dirty, get_default_slot_changes$4),
    						get_default_slot_context$4
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*output, input, connecting, hovering, bgColor, $connectedAnchors, invisible*/ 1831)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*anchor*/ 128 && div_id_value !== (div_id_value = /*anchor*/ ctx[7]?.id)) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (!current || dirty[0] & /*locked*/ 16) {
    				toggle_class(div, "locked", /*locked*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			/*div_binding*/ ctx[50](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let animationFrameId$2;
    const connectingFrom = writable(null);

    function changeAnchorSide(anchorElement, newSide, node) {
    	if (newSide === "self") return;
    	const parentNode = anchorElement.parentNode;
    	if (!parentNode) return;
    	parentNode.removeChild(anchorElement);
    	const newContainer = document.querySelector(`#anchors-${newSide}-${node.id}`);
    	if (!newContainer) return;
    	newContainer.appendChild(anchorElement);
    	if (anchorElement) node.recalculateAnchors();
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let connecting;
    	let connectedAnchors;
    	let dynamicDirection;

    	let $inputsStore,
    		$$unsubscribe_inputsStore = noop,
    		$$subscribe_inputsStore = () => ($$unsubscribe_inputsStore(), $$unsubscribe_inputsStore = subscribe(inputsStore, $$value => $$invalidate(51, $inputsStore = $$value)), inputsStore);

    	let $connectingFrom,
    		$$unsubscribe_connectingFrom = noop;

    	let $nodeConnectEvent;

    	let $connectedAnchors,
    		$$unsubscribe_connectedAnchors = noop,
    		$$subscribe_connectedAnchors = () => ($$unsubscribe_connectedAnchors(), $$unsubscribe_connectedAnchors = subscribe(connectedAnchors, $$value => $$invalidate(8, $connectedAnchors = $$value)), connectedAnchors);

    	let $rotating;
    	let $resizingHeight;
    	let $resizingWidth;

    	let $dynamicDirection,
    		$$unsubscribe_dynamicDirection = noop,
    		$$subscribe_dynamicDirection = () => ($$unsubscribe_dynamicDirection(), $$unsubscribe_dynamicDirection = subscribe(dynamicDirection, $$value => $$invalidate(42, $dynamicDirection = $$value)), dynamicDirection);

    	let $anchors;
    	let $mounted;
    	let $nodeLevelConnections;
    	validate_store(connectingFrom, 'connectingFrom');
    	component_subscribe($$self, connectingFrom, $$value => $$invalidate(37, $connectingFrom = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_inputsStore());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_connectingFrom());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_connectedAnchors());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_dynamicDirection());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Anchor', slots, ['default']);
    	const nodeDynamic = getContext("dynamic");
    	const node = getContext("node");
    	const edgeStore = getContext("edgeStore");
    	const cursorAnchor = getContext("cursorAnchor");
    	const graphDirection = getContext("direction");
    	const mounted = getContext("mounted");
    	validate_store(mounted, 'mounted');
    	component_subscribe($$self, mounted, value => $$invalidate(44, $mounted = value));
    	const graph = getContext("graph");
    	const nodeStore = getContext("nodeStore");
    	const graphEdge = getContext("graphEdge");
    	const nodeConnectEvent = getContext("nodeConnectEvent");
    	validate_store(nodeConnectEvent, 'nodeConnectEvent');
    	component_subscribe($$self, nodeConnectEvent, value => $$invalidate(38, $nodeConnectEvent = value));
    	let { bgColor = null } = $$props;
    	let { id = 0 } = $$props;
    	let { input = false } = $$props;
    	let { output = false } = $$props;
    	let { multiple = output ? true : input ? false : true } = $$props;
    	let { dynamic = nodeDynamic || false } = $$props;
    	let { edge = null } = $$props;
    	let { inputsStore = null } = $$props;
    	validate_store(inputsStore, 'inputsStore');
    	$$subscribe_inputsStore();
    	let { key = null } = $$props;
    	let { outputStore = null } = $$props;
    	let { connections = [] } = $$props;
    	let { edgeColor = writable(null) } = $$props;
    	let { edgeLabel = "" } = $$props;
    	let { locked = false } = $$props;
    	let { nodeConnect = false } = $$props;
    	let { edgeStyle = null } = $$props;
    	let { invisible = false } = $$props;

    	let { direction = graphDirection === "TD"
    	? input ? "north" : "south"
    	: input ? "west" : "east" } = $$props;

    	const dispatch = createEventDispatcher();
    	let anchorElement;
    	let anchor;
    	let tracking = false;
    	let hovering = false;
    	let previousConnectionCount = 0;
    	let type = input === output ? null : input ? "input" : "output";
    	let assignedConnections = [];
    	const nodeEdge = node.edge;
    	const anchors = node.anchors;
    	validate_store(anchors, 'anchors');
    	component_subscribe($$self, anchors, value => $$invalidate(43, $anchors = value));
    	const resizingWidth = node.resizingWidth;
    	validate_store(resizingWidth, 'resizingWidth');
    	component_subscribe($$self, resizingWidth, value => $$invalidate(41, $resizingWidth = value));
    	const resizingHeight = node.resizingHeight;
    	validate_store(resizingHeight, 'resizingHeight');
    	component_subscribe($$self, resizingHeight, value => $$invalidate(40, $resizingHeight = value));
    	const rotating = node.rotating;
    	validate_store(rotating, 'rotating');
    	component_subscribe($$self, rotating, value => $$invalidate(39, $rotating = value));
    	const nodeLevelConnections = node.connections;
    	validate_store(nodeLevelConnections, 'nodeLevelConnections');
    	component_subscribe($$self, nodeLevelConnections, value => $$invalidate(45, $nodeLevelConnections = value));

    	beforeUpdate(() => {
    		const anchorKey = `A-${id || anchors.count() + 1}/${node.id}`;

    		if (!anchor) {
    			$$invalidate(7, anchor = createAnchor(graph, node, anchorKey, { x: 0, y: 0 }, { width: 0, height: 0 }, inputsStore || outputStore || null, edge || nodeEdge || graphEdge || null, type, direction, dynamic, key, edgeColor));
    			anchors.add(anchor, anchor.id);
    		}

    		anchor.recalculatePosition();
    	});

    	onMount(() => {
    		if (anchorElement) anchor.recalculatePosition();
    	});

    	afterUpdate(() => {
    		if (anchorElement) anchor.recalculatePosition();
    	});

    	onDestroy(() => {
    		destroy();
    		cancelAnimationFrame(animationFrameId$2);
    	});

    	function handleMouseUp(e) {
    		if (connecting) return;

    		if ($connectedAnchors?.size && !multiple) {
    			edgeStore.delete("cursor");
    			if (!e.shiftKey) clearLinking(false);
    			return;
    		}

    		if ($connectingFrom) connectEdge(e);
    	}

    	function handleClick(e) {
    		if (locked) return;
    		if ($connectedAnchors?.size && !multiple && !$connectingFrom) return disconnect();
    		if (!$connectingFrom) return startEdge();
    		connectEdge(e);
    	}

    	function startEdge() {
    		if (input === output) {
    			set_store_value(connectingFrom, $connectingFrom = { anchor, store: null, key: null }, $connectingFrom);
    			createCursorEdge(anchor, cursorAnchor);
    		} else if (input) {
    			set_store_value(connectingFrom, $connectingFrom = { anchor, store: inputsStore, key }, $connectingFrom);
    			createCursorEdge(cursorAnchor, anchor);
    		} else if (output) {
    			set_store_value(connectingFrom, $connectingFrom = { anchor, store: outputStore, key: null }, $connectingFrom);
    			createCursorEdge(anchor, cursorAnchor);
    		}
    	}

    	function createCursorEdge(source, target, disconnect2 = false) {
    		const edgeConfig = {
    			color: edgeColor,
    			label: { text: edgeLabel }
    		};

    		if (disconnect2) edgeConfig.disconnect = true;
    		if (edgeStyle) edgeConfig.type = edgeStyle;
    		const newEdge = createEdge({ source, target }, source?.edge || null, edgeConfig);
    		edgeStore.add(newEdge, "cursor");
    	}

    	function connectEdge(e) {
    		edgeStore.delete("cursor");
    		if (!$connectingFrom) return;
    		const connectingType = $connectingFrom.anchor.type;

    		if ($connectingFrom.anchor === anchor || connectingType === anchor.type && connectingType) {
    			clearLinking(false);
    			return;
    		}

    		anchor.recalculatePosition();
    		let source;
    		let target;

    		if (input === output) {
    			if (connectingType === "input") {
    				source = anchor;
    				target = $connectingFrom.anchor;
    			} else {
    				source = $connectingFrom.anchor;
    				target = anchor;
    			}
    		} else if (input) {
    			source = $connectingFrom.anchor;
    			target = anchor;
    		} else {
    			source = anchor;
    			target = $connectingFrom.anchor;
    		}

    		const success = connectAnchors(source, target);

    		if (success) {
    			connectStores();
    		}

    		if (!e.shiftKey) {
    			clearLinking(success);
    		}
    	}

    	function connectAnchors(source, target) {
    		if (source === target) return false;
    		if (get_store_value(source.connected).has(anchor)) return false;

    		const edgeConfig = {
    			color: edgeColor,
    			label: { text: edgeLabel }
    		};

    		if (edgeStyle) edgeConfig.type = edgeStyle;
    		const newEdge = createEdge({ source, target }, source?.edge || null, edgeConfig);
    		if (!source.node || !target.node) return false;
    		edgeStore.add(newEdge, new Set([source, target, source.node, target.node])); 
    		return true;
    	}

    	function connectStores() {
    		if (input && $connectingFrom && $connectingFrom.store) {
    			if ($inputsStore && key && inputsStore && typeof inputsStore.set === "function" && typeof inputsStore.update === "function") set_store_value(inputsStore, $inputsStore[key] = $connectingFrom.store, $inputsStore);
    		} else if (output && $connectingFrom && $connectingFrom.store) {
    			const { store, key: key2 } = $connectingFrom;

    			if (store && key2 && typeof store.update === "function") store.update(store2 => {
    				if (!outputStore) return store2;
    				store2[key2] = outputStore;
    				return store2;
    			});
    		}
    	}

    	function disconnectStore() {
    		if ($inputsStore && key && $inputsStore[key]) set_store_value(inputsStore, $inputsStore[key] = writable(get_store_value($inputsStore[key])), $inputsStore);
    	}

    	function clearLinking(connectionMade) {
    		if (connectionMade || !$nodeConnectEvent) {
    			set_store_value(connectingFrom, $connectingFrom = null, $connectingFrom);
    			set_store_value(nodeConnectEvent, $nodeConnectEvent = null, $nodeConnectEvent);
    		}
    	}

    	function trackPosition() {
    		if (!tracking) return;
    		if (anchorElement) anchor.recalculatePosition();
    		animationFrameId$2 = requestAnimationFrame(trackPosition);
    	}

    	function destroy() {
    		edgeStore.delete("cursor");
    		const connections2 = edgeStore.match(anchor);
    		connections2.forEach(edge2 => edgeStore.delete(edge2));
    		clearLinking(false);
    		disconnectStore();
    	}

    	function disconnect() {
    		if (get_store_value(anchor.connected).size > 1) return;
    		const source = Array.from(get_store_value(anchor.connected))[0];
    		if (source.type === "input") return;
    		destroy();

    		if (source.type === "output") {
    			createCursorEdge(source, cursorAnchor, true);
    			disconnectStore();
    			const store = source.store;
    			set_store_value(connectingFrom, $connectingFrom = { anchor: source, store, key: null }, $connectingFrom);
    		} else {
    			createCursorEdge(source, cursorAnchor, true);
    			set_store_value(connectingFrom, $connectingFrom = { anchor: source, store: null, key: null }, $connectingFrom);
    		}
    	}

    	function checkNodeLevelConnections() {
    		assignedConnections.forEach((connection, index) => {
    			if (!connection) return;
    			const connected = processConnection(connection);
    			if (connected) $$invalidate(22, connections[index] = null, connections);
    		});

    		$$invalidate(36, assignedConnections = assignedConnections.filter(connection => connection !== null));
    	}

    	function checkDirectConnections() {
    		connections.forEach((connection, index) => {
    			if (!connection) return;
    			const connected = processConnection(connection);
    			if (connected) $$invalidate(22, connections[index] = null, connections);
    		});

    		$$invalidate(22, connections = connections.filter(connection => connection !== null));
    	}

    	const processConnection = connection => {
    		let nodeId;
    		let anchorId;
    		let anchorToConnect = null;

    		if (Array.isArray(connection)) {
    			nodeId = connection[0].toString();
    			anchorId = connection[1].toString();
    		} else {
    			nodeId = connection.toString();
    			anchorId = null;
    		}

    		const nodekey = `N-${nodeId}`;
    		const nodeToConnect = nodeStore.get(nodekey);

    		if (!nodeToConnect) {
    			return false;
    		}

    		if (!anchorId) {
    			const anchorStore = get_store_value(nodeToConnect.anchors);
    			const anchors2 = Array.from(anchorStore.values());

    			if (!anchors2.length) {
    				return false;
    			}

    			anchorToConnect = anchors2.reduce(
    				(a, b) => {
    					if (!a && b.type === "output") return null;
    					if (b.type === "output") return a;
    					if (!a) return b;
    					if (get_store_value(b.connected).size < get_store_value(a.connected).size) return b;
    					return a;
    				},
    				null
    			);
    		} else {
    			const anchorKey = `A-${anchorId}/${nodekey}`;
    			anchorToConnect = nodeToConnect.anchors.get(anchorKey) || null;
    		}

    		if (!anchorToConnect) {
    			return false;
    		}

    		connectAnchors(anchor, anchorToConnect);

    		if (anchorToConnect.store && (inputsStore || outputStore)) {
    			if (input && anchorToConnect.type === "output") {
    				if ($inputsStore && key && inputsStore && typeof inputsStore.set === "function" && typeof inputsStore.update === "function") set_store_value(inputsStore, $inputsStore[key] = anchorToConnect.store, $inputsStore);
    			} else if (output && anchorToConnect.type === "input") {
    				const { store, inputKey } = anchorToConnect;

    				if (store && inputKey && typeof store.update === "function") store.update(store2 => {
    					if (!outputStore) return store2;
    					store2[inputKey] = outputStore;
    					return store2;
    				});
    			}
    		}

    		return true;
    	};

    	const writable_props = [
    		'bgColor',
    		'id',
    		'input',
    		'output',
    		'multiple',
    		'dynamic',
    		'edge',
    		'inputsStore',
    		'key',
    		'outputStore',
    		'connections',
    		'edgeColor',
    		'edgeLabel',
    		'locked',
    		'nodeConnect',
    		'edgeStyle',
    		'invisible',
    		'direction'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Anchor> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = () => $$invalidate(9, hovering = true);
    	const mouseleave_handler = () => $$invalidate(9, hovering = false);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			anchorElement = $$value;
    			$$invalidate(6, anchorElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('bgColor' in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ('id' in $$props) $$invalidate(23, id = $$props.id);
    		if ('input' in $$props) $$invalidate(1, input = $$props.input);
    		if ('output' in $$props) $$invalidate(2, output = $$props.output);
    		if ('multiple' in $$props) $$invalidate(24, multiple = $$props.multiple);
    		if ('dynamic' in $$props) $$invalidate(25, dynamic = $$props.dynamic);
    		if ('edge' in $$props) $$invalidate(26, edge = $$props.edge);
    		if ('inputsStore' in $$props) $$subscribe_inputsStore($$invalidate(3, inputsStore = $$props.inputsStore));
    		if ('key' in $$props) $$invalidate(27, key = $$props.key);
    		if ('outputStore' in $$props) $$invalidate(28, outputStore = $$props.outputStore);
    		if ('connections' in $$props) $$invalidate(22, connections = $$props.connections);
    		if ('edgeColor' in $$props) $$invalidate(29, edgeColor = $$props.edgeColor);
    		if ('edgeLabel' in $$props) $$invalidate(30, edgeLabel = $$props.edgeLabel);
    		if ('locked' in $$props) $$invalidate(4, locked = $$props.locked);
    		if ('nodeConnect' in $$props) $$invalidate(31, nodeConnect = $$props.nodeConnect);
    		if ('edgeStyle' in $$props) $$invalidate(32, edgeStyle = $$props.edgeStyle);
    		if ('invisible' in $$props) $$invalidate(5, invisible = $$props.invisible);
    		if ('direction' in $$props) $$invalidate(33, direction = $$props.direction);
    		if ('$$scope' in $$props) $$invalidate(46, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		DefaultAnchor,
    		onMount,
    		getContext,
    		onDestroy,
    		afterUpdate,
    		writable,
    		get: get_store_value,
    		createEdge,
    		createAnchor,
    		generateOutput,
    		createEventDispatcher,
    		beforeUpdate,
    		animationFrameId: animationFrameId$2,
    		connectingFrom,
    		changeAnchorSide,
    		nodeDynamic,
    		node,
    		edgeStore,
    		cursorAnchor,
    		graphDirection,
    		mounted,
    		graph,
    		nodeStore,
    		graphEdge,
    		nodeConnectEvent,
    		bgColor,
    		id,
    		input,
    		output,
    		multiple,
    		dynamic,
    		edge,
    		inputsStore,
    		key,
    		outputStore,
    		connections,
    		edgeColor,
    		edgeLabel,
    		locked,
    		nodeConnect,
    		edgeStyle,
    		invisible,
    		direction,
    		dispatch,
    		anchorElement,
    		anchor,
    		tracking,
    		hovering,
    		previousConnectionCount,
    		type,
    		assignedConnections,
    		nodeEdge,
    		anchors,
    		resizingWidth,
    		resizingHeight,
    		rotating,
    		nodeLevelConnections,
    		handleMouseUp,
    		handleClick,
    		startEdge,
    		createCursorEdge,
    		connectEdge,
    		connectAnchors,
    		connectStores,
    		disconnectStore,
    		clearLinking,
    		trackPosition,
    		destroy,
    		disconnect,
    		checkNodeLevelConnections,
    		checkDirectConnections,
    		processConnection,
    		connecting,
    		dynamicDirection,
    		connectedAnchors,
    		$inputsStore,
    		$connectingFrom,
    		$nodeConnectEvent,
    		$connectedAnchors,
    		$rotating,
    		$resizingHeight,
    		$resizingWidth,
    		$dynamicDirection,
    		$anchors,
    		$mounted,
    		$nodeLevelConnections
    	});

    	$$self.$inject_state = $$props => {
    		if ('bgColor' in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ('id' in $$props) $$invalidate(23, id = $$props.id);
    		if ('input' in $$props) $$invalidate(1, input = $$props.input);
    		if ('output' in $$props) $$invalidate(2, output = $$props.output);
    		if ('multiple' in $$props) $$invalidate(24, multiple = $$props.multiple);
    		if ('dynamic' in $$props) $$invalidate(25, dynamic = $$props.dynamic);
    		if ('edge' in $$props) $$invalidate(26, edge = $$props.edge);
    		if ('inputsStore' in $$props) $$subscribe_inputsStore($$invalidate(3, inputsStore = $$props.inputsStore));
    		if ('key' in $$props) $$invalidate(27, key = $$props.key);
    		if ('outputStore' in $$props) $$invalidate(28, outputStore = $$props.outputStore);
    		if ('connections' in $$props) $$invalidate(22, connections = $$props.connections);
    		if ('edgeColor' in $$props) $$invalidate(29, edgeColor = $$props.edgeColor);
    		if ('edgeLabel' in $$props) $$invalidate(30, edgeLabel = $$props.edgeLabel);
    		if ('locked' in $$props) $$invalidate(4, locked = $$props.locked);
    		if ('nodeConnect' in $$props) $$invalidate(31, nodeConnect = $$props.nodeConnect);
    		if ('edgeStyle' in $$props) $$invalidate(32, edgeStyle = $$props.edgeStyle);
    		if ('invisible' in $$props) $$invalidate(5, invisible = $$props.invisible);
    		if ('direction' in $$props) $$invalidate(33, direction = $$props.direction);
    		if ('anchorElement' in $$props) $$invalidate(6, anchorElement = $$props.anchorElement);
    		if ('anchor' in $$props) $$invalidate(7, anchor = $$props.anchor);
    		if ('tracking' in $$props) $$invalidate(34, tracking = $$props.tracking);
    		if ('hovering' in $$props) $$invalidate(9, hovering = $$props.hovering);
    		if ('previousConnectionCount' in $$props) $$invalidate(35, previousConnectionCount = $$props.previousConnectionCount);
    		if ('type' in $$props) type = $$props.type;
    		if ('assignedConnections' in $$props) $$invalidate(36, assignedConnections = $$props.assignedConnections);
    		if ('connecting' in $$props) $$invalidate(10, connecting = $$props.connecting);
    		if ('dynamicDirection' in $$props) $$subscribe_dynamicDirection($$invalidate(11, dynamicDirection = $$props.dynamicDirection));
    		if ('connectedAnchors' in $$props) $$subscribe_connectedAnchors($$invalidate(12, connectedAnchors = $$props.connectedAnchors));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*anchor*/ 128 | $$self.$$.dirty[1] & /*$connectingFrom*/ 64) {
    			$$invalidate(10, connecting = $connectingFrom?.anchor === anchor);
    		}

    		if ($$self.$$.dirty[0] & /*anchor*/ 128) {
    			$$subscribe_connectedAnchors($$invalidate(12, connectedAnchors = anchor && anchor.connected));
    		}

    		if ($$self.$$.dirty[0] & /*anchor*/ 128) {
    			$$subscribe_dynamicDirection($$invalidate(11, dynamicDirection = anchor?.direction));
    		}

    		if ($$self.$$.dirty[0] & /*dynamic, anchorElement*/ 33554496 | $$self.$$.dirty[1] & /*$dynamicDirection*/ 2048) {
    			if (dynamic && anchorElement) changeAnchorSide(anchorElement, $dynamicDirection, node);
    		}

    		if ($$self.$$.dirty[0] & /*input*/ 2 | $$self.$$.dirty[1] & /*$nodeLevelConnections*/ 16384) {
    			if (!input) {
    				const poppedConnections = $nodeLevelConnections?.pop();
    				if (poppedConnections) $$invalidate(36, assignedConnections = poppedConnections);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*connections*/ 4194304 | $$self.$$.dirty[1] & /*$mounted*/ 8192) {
    			if ($mounted === nodeStore.count() && connections.length) {
    				checkDirectConnections();
    			}
    		}

    		if ($$self.$$.dirty[1] & /*nodeConnect, $nodeConnectEvent*/ 129) {
    			if (nodeConnect && $nodeConnectEvent) {
    				handleMouseUp($nodeConnectEvent);
    			}
    		}

    		if ($$self.$$.dirty[1] & /*$mounted, assignedConnections*/ 8224) {
    			if ($mounted === nodeStore.count() && assignedConnections.length) {
    				checkNodeLevelConnections();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*anchorElement, $connectedAnchors, anchor*/ 448 | $$self.$$.dirty[1] & /*$anchors, $dynamicDirection*/ 6144) {
    			if (anchorElement) {
    				anchor.recalculatePosition();
    			}
    		}

    		if ($$self.$$.dirty[1] & /*tracking, $resizingWidth, $resizingHeight, $rotating*/ 1800) {
    			if (!tracking && ($resizingWidth || $resizingHeight || $rotating)) {
    				$$invalidate(34, tracking = true);
    				trackPosition();
    			} else if (!$resizingWidth && !$resizingHeight && tracking && !$rotating) {
    				$$invalidate(34, tracking = false);
    				cancelAnimationFrame(animationFrameId$2);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$connectedAnchors, anchor*/ 384 | $$self.$$.dirty[1] & /*previousConnectionCount*/ 16) {
    			if ($connectedAnchors) {
    				if ($connectedAnchors.size < previousConnectionCount) {
    					dispatch("disconnection", { node, anchor });
    				} else if ($connectedAnchors.size > previousConnectionCount) {
    					dispatch("connection", { node, anchor });
    				}

    				$$invalidate(35, previousConnectionCount = $connectedAnchors.size);
    			}
    		}
    	};

    	return [
    		bgColor,
    		input,
    		output,
    		inputsStore,
    		locked,
    		invisible,
    		anchorElement,
    		anchor,
    		$connectedAnchors,
    		hovering,
    		connecting,
    		dynamicDirection,
    		connectedAnchors,
    		mounted,
    		nodeConnectEvent,
    		anchors,
    		resizingWidth,
    		resizingHeight,
    		rotating,
    		nodeLevelConnections,
    		handleMouseUp,
    		handleClick,
    		connections,
    		id,
    		multiple,
    		dynamic,
    		edge,
    		key,
    		outputStore,
    		edgeColor,
    		edgeLabel,
    		nodeConnect,
    		edgeStyle,
    		direction,
    		tracking,
    		previousConnectionCount,
    		assignedConnections,
    		$connectingFrom,
    		$nodeConnectEvent,
    		$rotating,
    		$resizingHeight,
    		$resizingWidth,
    		$dynamicDirection,
    		$anchors,
    		$mounted,
    		$nodeLevelConnections,
    		$$scope,
    		slots,
    		mouseenter_handler,
    		mouseleave_handler,
    		div_binding
    	];
    }

    class Anchor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$r,
    			create_fragment$r,
    			safe_not_equal,
    			{
    				bgColor: 0,
    				id: 23,
    				input: 1,
    				output: 2,
    				multiple: 24,
    				dynamic: 25,
    				edge: 26,
    				inputsStore: 3,
    				key: 27,
    				outputStore: 28,
    				connections: 22,
    				edgeColor: 29,
    				edgeLabel: 30,
    				locked: 4,
    				nodeConnect: 31,
    				edgeStyle: 32,
    				invisible: 5,
    				direction: 33
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Anchor",
    			options,
    			id: create_fragment$r.name
    		});
    	}

    	get bgColor() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get input() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get output() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set output(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiple() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiple(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dynamic() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dynamic(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edge() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edge(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputsStore() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputsStore(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputStore() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputStore(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get connections() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set connections(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeColor() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeColor(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeLabel() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeLabel(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get locked() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set locked(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nodeConnect() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodeConnect(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeStyle() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeStyle(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invisible() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invisible(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<Anchor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Anchor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Resizer/Resizer.svelte generated by Svelte v3.58.0 */
    const file$j = "node_modules/svelvet/dist/components/Resizer/Resizer.svelte";

    function create_fragment$q(ctx) {
    	let div0;
    	let resizeHandler_action;
    	let t0;
    	let div1;
    	let resizeHandler_action_1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "svelte-wz8gof");
    			toggle_class(div0, "width", /*width*/ ctx[0]);
    			add_location(div0, file$j, 112, 0, 3091);
    			attr_dev(div1, "class", "svelte-wz8gof");
    			toggle_class(div1, "height", /*height*/ ctx[1]);
    			add_location(div1, file$j, 113, 0, 3141);
    			attr_dev(div2, "class", "svelte-wz8gof");
    			toggle_class(div2, "both", /*both*/ ctx[11]);
    			add_location(div2, file$j, 114, 0, 3193);
    			attr_dev(div3, "class", "svelte-wz8gof");
    			toggle_class(div3, "rotation", /*rotation*/ ctx[2]);
    			add_location(div3, file$j, 115, 0, 3241);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(resizeHandler_action = /*resizeHandler*/ ctx[12].call(null, div0, { width: /*width*/ ctx[0] })),
    					action_destroyer(resizeHandler_action_1 = /*resizeHandler*/ ctx[12].call(null, div1, { height: /*height*/ ctx[1] })),
    					action_destroyer(/*resizeHandler*/ ctx[12].call(null, div2, { both: /*both*/ ctx[11] })),
    					action_destroyer(/*rotateHandler*/ ctx[13].call(null, div3))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (resizeHandler_action && is_function(resizeHandler_action.update) && dirty[0] & /*width*/ 1) resizeHandler_action.update.call(null, { width: /*width*/ ctx[0] });

    			if (dirty[0] & /*width*/ 1) {
    				toggle_class(div0, "width", /*width*/ ctx[0]);
    			}

    			if (resizeHandler_action_1 && is_function(resizeHandler_action_1.update) && dirty[0] & /*height*/ 2) resizeHandler_action_1.update.call(null, { height: /*height*/ ctx[1] });

    			if (dirty[0] & /*height*/ 2) {
    				toggle_class(div1, "height", /*height*/ ctx[1]);
    			}

    			if (dirty[0] & /*rotation*/ 4) {
    				toggle_class(div3, "rotation", /*rotation*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function radiansToDegrees(radians) {
    	return radians * (180 / Math.PI);
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let resizingWidth;
    	let resizingHeight;
    	let rotating;
    	let nodeRotation;
    	let heightStore;
    	let widthStore;
    	let x;
    	let y;
    	let centerPoint;
    	let cursorY;
    	let cursorX;

    	let $rotating,
    		$$unsubscribe_rotating = noop,
    		$$subscribe_rotating = () => ($$unsubscribe_rotating(), $$unsubscribe_rotating = subscribe(rotating, $$value => $$invalidate(20, $rotating = $$value)), rotating);

    	let $initialClickPosition;

    	let $nodeRotation,
    		$$unsubscribe_nodeRotation = noop,
    		$$subscribe_nodeRotation = () => ($$unsubscribe_nodeRotation(), $$unsubscribe_nodeRotation = subscribe(nodeRotation, $$value => $$invalidate(31, $nodeRotation = $$value)), nodeRotation);

    	let $resizingHeight,
    		$$unsubscribe_resizingHeight = noop,
    		$$subscribe_resizingHeight = () => ($$unsubscribe_resizingHeight(), $$unsubscribe_resizingHeight = subscribe(resizingHeight, $$value => $$invalidate(21, $resizingHeight = $$value)), resizingHeight);

    	let $resizingWidth,
    		$$unsubscribe_resizingWidth = noop,
    		$$subscribe_resizingWidth = () => ($$unsubscribe_resizingWidth(), $$unsubscribe_resizingWidth = subscribe(resizingWidth, $$value => $$invalidate(22, $resizingWidth = $$value)), resizingWidth);

    	let $cursor;

    	let $widthStore,
    		$$unsubscribe_widthStore = noop,
    		$$subscribe_widthStore = () => ($$unsubscribe_widthStore(), $$unsubscribe_widthStore = subscribe(widthStore, $$value => $$invalidate(24, $widthStore = $$value)), widthStore);

    	let $position;

    	let $heightStore,
    		$$unsubscribe_heightStore = noop,
    		$$subscribe_heightStore = () => ($$unsubscribe_heightStore(), $$unsubscribe_heightStore = subscribe(heightStore, $$value => $$invalidate(26, $heightStore = $$value)), heightStore);

    	validate_store(initialClickPosition, 'initialClickPosition');
    	component_subscribe($$self, initialClickPosition, $$value => $$invalidate(30, $initialClickPosition = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_rotating());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_nodeRotation());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_resizingHeight());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_resizingWidth());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_widthStore());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_heightStore());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Resizer', slots, []);
    	let { width = false } = $$props;
    	let { height = false } = $$props;
    	let { rotation = false } = $$props;
    	let { minHeight = 100 } = $$props;
    	let { minWidth = 200 } = $$props;
    	let graph = getContext("graph");
    	let node = getContext("node");
    	const { cursor } = graph;
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, value => $$invalidate(23, $cursor = value));
    	const position = node.position;
    	validate_store(position, 'position');
    	component_subscribe($$self, position, value => $$invalidate(25, $position = value));
    	let both = width && height;
    	let startingRotation = 0;
    	let initialClickAngle = 0;

    	function resizeHandler(node2, dimensions) {
    		const setResize = e => {
    			e.stopPropagation();
    			e.preventDefault();

    			dimensions.both
    			? set_store_value(resizingWidth, $resizingWidth = true, $resizingWidth)
    			: set_store_value(resizingWidth, $resizingWidth = false, $resizingWidth);

    			set_store_value(resizingWidth, $resizingWidth = dimensions.width || dimensions.both || false, $resizingWidth);
    			set_store_value(resizingHeight, $resizingHeight = dimensions.height || dimensions.both || false, $resizingHeight);
    			window.addEventListener("mouseup", removeResize);
    		};

    		const removeResize = () => {
    			set_store_value(resizingWidth, $resizingWidth = false, $resizingWidth);
    			set_store_value(resizingHeight, $resizingHeight = false, $resizingHeight);
    			window.removeEventListener("mouseup", removeResize);
    		};

    		node2.addEventListener("mousedown", setResize);

    		return {
    			destroy() {
    				node2.removeEventListener("mousedown", setResize);
    			}
    		};
    	}

    	function rotateHandler(node2) {
    		const setRotation = e => {
    			e.stopPropagation();
    			e.preventDefault();
    			startingRotation = $nodeRotation;
    			set_store_value(initialClickPosition, $initialClickPosition = { x: cursorX, y: cursorY }, $initialClickPosition);
    			const initialDeltaX = $initialClickPosition.x - centerPoint.x;
    			const initialDeltaY = $initialClickPosition.y - centerPoint.y;
    			initialClickAngle = Math.atan2(initialDeltaY, initialDeltaX);
    			set_store_value(rotating, $rotating = true, $rotating);
    			window.addEventListener("mouseup", removeRotation);
    		};

    		const removeRotation = () => {
    			set_store_value(rotating, $rotating = false, $rotating);
    			window.removeEventListener("mouseup", removeRotation);
    		};

    		node2.addEventListener("mousedown", setRotation);

    		return {
    			destroy() {
    				node2.removeEventListener("mousedown", setRotation);
    			}
    		};
    	}

    	function calculateRotation() {
    		const currentDeltaX = cursorX - centerPoint.x;
    		const currentDeltaY = cursorY - centerPoint.y;
    		const currentAngle = Math.atan2(currentDeltaY, currentDeltaX);
    		const angleDifference = initialClickAngle - currentAngle;
    		const newAngle = startingRotation - radiansToDegrees(angleDifference);
    		return newAngle;
    	}

    	const writable_props = ['width', 'height', 'rotation', 'minHeight', 'minWidth'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Resizer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('rotation' in $$props) $$invalidate(2, rotation = $$props.rotation);
    		if ('minHeight' in $$props) $$invalidate(14, minHeight = $$props.minHeight);
    		if ('minWidth' in $$props) $$invalidate(15, minWidth = $$props.minWidth);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		initialClickPosition,
    		width,
    		height,
    		rotation,
    		minHeight,
    		minWidth,
    		graph,
    		node,
    		cursor,
    		position,
    		both,
    		startingRotation,
    		initialClickAngle,
    		resizeHandler,
    		rotateHandler,
    		calculateRotation,
    		radiansToDegrees,
    		centerPoint,
    		cursorY,
    		cursorX,
    		y,
    		x,
    		widthStore,
    		heightStore,
    		nodeRotation,
    		rotating,
    		resizingHeight,
    		resizingWidth,
    		$rotating,
    		$initialClickPosition,
    		$nodeRotation,
    		$resizingHeight,
    		$resizingWidth,
    		$cursor,
    		$widthStore,
    		$position,
    		$heightStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('rotation' in $$props) $$invalidate(2, rotation = $$props.rotation);
    		if ('minHeight' in $$props) $$invalidate(14, minHeight = $$props.minHeight);
    		if ('minWidth' in $$props) $$invalidate(15, minWidth = $$props.minWidth);
    		if ('graph' in $$props) graph = $$props.graph;
    		if ('node' in $$props) $$invalidate(33, node = $$props.node);
    		if ('both' in $$props) $$invalidate(11, both = $$props.both);
    		if ('startingRotation' in $$props) startingRotation = $$props.startingRotation;
    		if ('initialClickAngle' in $$props) initialClickAngle = $$props.initialClickAngle;
    		if ('centerPoint' in $$props) centerPoint = $$props.centerPoint;
    		if ('cursorY' in $$props) $$invalidate(16, cursorY = $$props.cursorY);
    		if ('cursorX' in $$props) $$invalidate(17, cursorX = $$props.cursorX);
    		if ('y' in $$props) $$invalidate(18, y = $$props.y);
    		if ('x' in $$props) $$invalidate(19, x = $$props.x);
    		if ('widthStore' in $$props) $$subscribe_widthStore($$invalidate(3, widthStore = $$props.widthStore));
    		if ('heightStore' in $$props) $$subscribe_heightStore($$invalidate(4, heightStore = $$props.heightStore));
    		if ('nodeRotation' in $$props) $$subscribe_nodeRotation($$invalidate(5, nodeRotation = $$props.nodeRotation));
    		if ('rotating' in $$props) $$subscribe_rotating($$invalidate(6, rotating = $$props.rotating));
    		if ('resizingHeight' in $$props) $$subscribe_resizingHeight($$invalidate(7, resizingHeight = $$props.resizingHeight));
    		if ('resizingWidth' in $$props) $$subscribe_resizingWidth($$invalidate(8, resizingWidth = $$props.resizingWidth));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$position*/ 33554432) {
    			$$invalidate(19, x = $position.x);
    		}

    		if ($$self.$$.dirty[0] & /*$position*/ 33554432) {
    			$$invalidate(18, y = $position.y);
    		}

    		if ($$self.$$.dirty[0] & /*$cursor*/ 8388608) {
    			$$invalidate(17, cursorX = $cursor.x);
    		}

    		if ($$self.$$.dirty[0] & /*$resizingWidth, minWidth, cursorX, $position*/ 37912576) {
    			if ($resizingWidth) {
    				const newWidth = Math.max(minWidth, cursorX - $position.x);
    				set_store_value(widthStore, $widthStore = newWidth, $widthStore);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$cursor*/ 8388608) {
    			$$invalidate(16, cursorY = $cursor.y);
    		}

    		if ($$self.$$.dirty[0] & /*$resizingHeight, minHeight, cursorY, $position*/ 35733504) {
    			if ($resizingHeight) {
    				const newHeight = Math.max(minHeight, cursorY - $position.y);
    				set_store_value(heightStore, $heightStore = newHeight, $heightStore);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*x, $widthStore, y, $heightStore*/ 84672512) {
    			centerPoint = {
    				x: x + $widthStore / 2,
    				y: y + $heightStore / 2
    			};
    		}

    		if ($$self.$$.dirty[0] & /*$rotating, $cursor*/ 9437184) {
    			if ($rotating) {
    				set_store_value(nodeRotation, $nodeRotation = calculateRotation(), $nodeRotation);
    			}
    		}
    	};

    	$$subscribe_resizingWidth($$invalidate(8, resizingWidth = node.resizingWidth));
    	$$subscribe_resizingHeight($$invalidate(7, resizingHeight = node.resizingHeight));
    	$$subscribe_rotating($$invalidate(6, rotating = node.rotating));
    	$$subscribe_nodeRotation($$invalidate(5, nodeRotation = node.rotation));
    	$$subscribe_heightStore($$invalidate(4, heightStore = node.dimensions.height));
    	$$subscribe_widthStore($$invalidate(3, widthStore = node.dimensions.width));

    	return [
    		width,
    		height,
    		rotation,
    		widthStore,
    		heightStore,
    		nodeRotation,
    		rotating,
    		resizingHeight,
    		resizingWidth,
    		cursor,
    		position,
    		both,
    		resizeHandler,
    		rotateHandler,
    		minHeight,
    		minWidth,
    		cursorY,
    		cursorX,
    		y,
    		x,
    		$rotating,
    		$resizingHeight,
    		$resizingWidth,
    		$cursor,
    		$widthStore,
    		$position,
    		$heightStore
    	];
    }

    class Resizer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$q,
    			create_fragment$q,
    			safe_not_equal,
    			{
    				width: 0,
    				height: 1,
    				rotation: 2,
    				minHeight: 14,
    				minWidth: 15
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Resizer",
    			options,
    			id: create_fragment$q.name
    		});
    	}

    	get width() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotation() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotation(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minHeight() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minHeight(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minWidth() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Node/DefaultNode.svelte generated by Svelte v3.58.0 */
    const file$i = "node_modules/svelvet/dist/components/Node/DefaultNode.svelte";

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    // (33:1) {:else}
    function create_else_block$4(ctx) {
    	let div0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t;
    	let div1;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let current;
    	let each_value_3 = { length: /*$inputs*/ ctx[2] };
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*i*/ ctx[32];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_3(key, child_ctx));
    	}

    	let each_value_2 = { length: /*$outputs*/ ctx[3] };
    	validate_each_argument(each_value_2);
    	const get_key_1 = ctx => /*i*/ ctx[32];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_1);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "input-anchors svelte-iy7x6k");
    			toggle_class(div0, "top", /*top*/ ctx[15]);
    			toggle_class(div0, "left", /*left*/ ctx[17]);
    			add_location(div0, file$i, 33, 2, 1102);
    			attr_dev(div1, "class", "output-anchors svelte-iy7x6k");
    			toggle_class(div1, "bottom", /*bottom*/ ctx[16]);
    			toggle_class(div1, "right", /*right*/ ctx[18]);
    			add_location(div1, file$i, 38, 2, 1303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*top, $inputs*/ 32772) {
    				each_value_3 = { length: /*$inputs*/ ctx[2] };
    				validate_each_argument(each_value_3);
    				group_outros();
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_3, each0_lookup, div0, outro_and_destroy_block, create_each_block_3, null, get_each_context_3);
    				check_outros();
    			}

    			if (dirty[0] & /*top, $outputs*/ 32776) {
    				each_value_2 = { length: /*$outputs*/ ctx[3] };
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value_2, each1_lookup, div1, outro_and_destroy_block, create_each_block_2, null, get_each_context_2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(33:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:1) {#if dynamic}
    function create_if_block_1$4(ctx) {
    	let t;
    	let each1_anchor;
    	let current;
    	let each_value_1 = { length: /*$inputs*/ ctx[2] };
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = { length: /*$outputs*/ ctx[3] };
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$inputs*/ 4) {
    				const old_length = each_value_1.length;
    				each_value_1 = { length: /*$inputs*/ ctx[2] };
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = old_length; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*$outputs*/ 8) {
    				const old_length = each_value.length;
    				each_value = { length: /*$outputs*/ ctx[3] };
    				validate_each_argument(each_value);
    				let i;

    				for (i = old_length; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(26:1) {#if dynamic}",
    		ctx
    	});

    	return block;
    }

    // (35:3) {#each { length: $inputs } as _, i (i)}
    function create_each_block_3(key_1, ctx) {
    	let first;
    	let anchor;
    	let current;

    	anchor = new Anchor({
    			props: {
    				input: true,
    				direction: /*top*/ ctx[15] ? 'north' : 'west'
    			},
    			$$inline: true
    		});

    	anchor.$on("connection", /*connection_handler_2*/ ctx[24]);
    	anchor.$on("disconnection", /*disconnection_handler_2*/ ctx[25]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(anchor.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor$1) {
    			insert_dev(target, first, anchor$1);
    			mount_component(anchor, target, anchor$1);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(anchor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(anchor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(anchor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(35:3) {#each { length: $inputs } as _, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (40:3) {#each { length: $outputs } as _, i (i)}
    function create_each_block_2(key_1, ctx) {
    	let first;
    	let anchor;
    	let current;

    	anchor = new Anchor({
    			props: {
    				output: true,
    				direction: /*top*/ ctx[15] ? 'south' : 'east'
    			},
    			$$inline: true
    		});

    	anchor.$on("connection", /*connection_handler_3*/ ctx[26]);
    	anchor.$on("disconnection", /*disconnection_handler_3*/ ctx[27]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(anchor.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor$1) {
    			insert_dev(target, first, anchor$1);
    			mount_component(anchor, target, anchor$1);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(anchor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(anchor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(anchor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(40:3) {#each { length: $outputs } as _, i (i)}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#each { length: $inputs } as _, i}
    function create_each_block_1$2(ctx) {
    	let anchor;
    	let current;
    	anchor = new Anchor({ $$inline: true });
    	anchor.$on("connection", /*connection_handler*/ ctx[20]);
    	anchor.$on("disconnection", /*disconnection_handler*/ ctx[21]);

    	const block = {
    		c: function create() {
    			create_component(anchor.$$.fragment);
    		},
    		m: function mount(target, anchor$1) {
    			mount_component(anchor, target, anchor$1);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(anchor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(anchor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(anchor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(27:2) {#each { length: $inputs } as _, i}",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#each { length: $outputs } as _, i}
    function create_each_block$4(ctx) {
    	let anchor;
    	let current;
    	anchor = new Anchor({ $$inline: true });
    	anchor.$on("connection", /*connection_handler_1*/ ctx[22]);
    	anchor.$on("disconnection", /*disconnection_handler_1*/ ctx[23]);

    	const block = {
    		c: function create() {
    			create_component(anchor.$$.fragment);
    		},
    		m: function mount(target, anchor$1) {
    			mount_component(anchor, target, anchor$1);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(anchor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(anchor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(anchor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(30:2) {#each { length: $outputs } as _, i}",
    		ctx
    	});

    	return block;
    }

    // (47:1) {#if $resizable}
    function create_if_block$b(ctx) {
    	let resizer;
    	let current;

    	resizer = new Resizer({
    			props: {
    				width: true,
    				height: true,
    				rotation: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(resizer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(resizer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(resizer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(resizer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(resizer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(47:1) {#if $resizable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let p;
    	let t1;
    	let t2;
    	let style_border_radius = `${/*$borderRadius*/ ctx[1]}px`;
    	let current;
    	const if_block_creators = [create_if_block_1$4, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*dynamic*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*$resizable*/ ctx[6] && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(/*$label*/ ctx[5]);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(p, "class", "svelte-iy7x6k");
    			set_style(p, "color", /*$textColor*/ ctx[4]);
    			add_location(p, file$i, 44, 1, 1517);
    			attr_dev(div, "class", "default-node svelte-iy7x6k");
    			toggle_class(div, "selected", /*selected*/ ctx[0]);
    			set_style(div, "border-radius", style_border_radius);
    			add_location(div, file$i, 24, 0, 807);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block0.p(ctx, dirty);
    			if (!current || dirty[0] & /*$label*/ 32) set_data_dev(t1, /*$label*/ ctx[5]);

    			if (dirty[0] & /*$textColor*/ 16) {
    				set_style(p, "color", /*$textColor*/ ctx[4]);
    			}

    			if (/*$resizable*/ ctx[6]) {
    				if (if_block1) {
    					if (dirty[0] & /*$resizable*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$b(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*selected*/ 1) {
    				toggle_class(div, "selected", /*selected*/ ctx[0]);
    			}

    			if (dirty[0] & /*$borderRadius*/ 2 && style_border_radius !== (style_border_radius = `${/*$borderRadius*/ ctx[1]}px`)) {
    				set_style(div, "border-radius", style_border_radius);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let direction;
    	let $directionStore;
    	let $borderRadius;
    	let $inputs;
    	let $outputs;
    	let $textColor;
    	let $label;
    	let $resizable;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DefaultNode', slots, []);
    	const dynamic = getContext("dynamic");
    	const node = getContext("node");
    	let { selected } = $$props;
    	const label = node.label;
    	validate_store(label, 'label');
    	component_subscribe($$self, label, value => $$invalidate(5, $label = value));
    	const borderRadius = node.borderRadius;
    	validate_store(borderRadius, 'borderRadius');
    	component_subscribe($$self, borderRadius, value => $$invalidate(1, $borderRadius = value));
    	const textColor = node.textColor;
    	validate_store(textColor, 'textColor');
    	component_subscribe($$self, textColor, value => $$invalidate(4, $textColor = value));
    	const inputs = node.inputs;
    	validate_store(inputs, 'inputs');
    	component_subscribe($$self, inputs, value => $$invalidate(2, $inputs = value));
    	const outputs = node.outputs;
    	validate_store(outputs, 'outputs');
    	component_subscribe($$self, outputs, value => $$invalidate(3, $outputs = value));
    	const resizable = node.resizable;
    	validate_store(resizable, 'resizable');
    	component_subscribe($$self, resizable, value => $$invalidate(6, $resizable = value));
    	const directionStore = node.direction;
    	validate_store(directionStore, 'directionStore');
    	component_subscribe($$self, directionStore, value => $$invalidate(19, $directionStore = value));
    	let top = get_store_value(node.direction) === "TD" ? true : false;
    	let bottom = get_store_value(node.direction) === "TD" ? true : false;
    	let left = get_store_value(node.direction) === "TD" ? false : true;
    	let right = get_store_value(node.direction) === "TD" ? false : true;

    	$$self.$$.on_mount.push(function () {
    		if (selected === undefined && !('selected' in $$props || $$self.$$.bound[$$self.$$.props['selected']])) {
    			console.warn("<DefaultNode> was created without expected prop 'selected'");
    		}
    	});

    	const writable_props = ['selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DefaultNode> was created with unknown prop '${key}'`);
    	});

    	function connection_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function disconnection_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function connection_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function disconnection_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function connection_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function disconnection_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function connection_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function disconnection_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({
    		Resizer,
    		Anchor,
    		get: get_store_value,
    		getContext,
    		dynamic,
    		node,
    		selected,
    		label,
    		borderRadius,
    		textColor,
    		inputs,
    		outputs,
    		resizable,
    		directionStore,
    		top,
    		bottom,
    		left,
    		right,
    		direction,
    		$directionStore,
    		$borderRadius,
    		$inputs,
    		$outputs,
    		$textColor,
    		$label,
    		$resizable
    	});

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('top' in $$props) $$invalidate(15, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(16, bottom = $$props.bottom);
    		if ('left' in $$props) $$invalidate(17, left = $$props.left);
    		if ('right' in $$props) $$invalidate(18, right = $$props.right);
    		if ('direction' in $$props) direction = $$props.direction;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$directionStore*/ 524288) {
    			direction = $directionStore;
    		}
    	};

    	return [
    		selected,
    		$borderRadius,
    		$inputs,
    		$outputs,
    		$textColor,
    		$label,
    		$resizable,
    		dynamic,
    		label,
    		borderRadius,
    		textColor,
    		inputs,
    		outputs,
    		resizable,
    		directionStore,
    		top,
    		bottom,
    		left,
    		right,
    		$directionStore,
    		connection_handler,
    		disconnection_handler,
    		connection_handler_1,
    		disconnection_handler_1,
    		connection_handler_2,
    		disconnection_handler_2,
    		connection_handler_3,
    		disconnection_handler_3
    	];
    }

    class DefaultNode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, { selected: 0 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefaultNode",
    			options,
    			id: create_fragment$p.name
    		});
    	}

    	get selected() {
    		throw new Error("<DefaultNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<DefaultNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Node/InternalNode.svelte generated by Svelte v3.58.0 */
    const file$h = "node_modules/svelvet/dist/components/Node/InternalNode.svelte";
    const get_default_slot_changes$3 = dirty => ({ selected: dirty[0] & /*selected*/ 2048 });

    const get_default_slot_context$3 = ctx => ({
    	grabHandle: /*grabHandle*/ ctx[52],
    	selected: /*selected*/ ctx[11],
    	destroy: /*destroy*/ ctx[49]
    });

    // (186:0) {#if !hidden}
    function create_if_block$a(ctx) {
    	let div;
    	let div_resize_listener;
    	let style_top = `${/*actualPosition*/ ctx[14].y}px`;
    	let style_left = `${/*actualPosition*/ ctx[14].x}px`;
    	let style_width = `${/*$widthStore*/ ctx[19]}px`;
    	let style_height = `${/*$heightStore*/ ctx[18]}px`;
    	let style_transform = `rotate(${/*$rotation*/ ctx[20]}deg)`;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = !/*collapsed*/ ctx[47] && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "id", /*id*/ ctx[30]);
    			attr_dev(div, "class", "svelvet-node svelte-9fi8tt");
    			attr_dev(div, "tabindex", 0);
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[61].call(div));
    			toggle_class(div, "selected", /*selected*/ ctx[11]);
    			toggle_class(div, "locked", /*$locked*/ ctx[16] || /*$nodeLock*/ ctx[15]);
    			set_style(div, "top", style_top);
    			set_style(div, "left", style_left);
    			set_style(div, "width", style_width);
    			set_style(div, "height", style_height);
    			set_style(div, "z-index", /*$zIndex*/ ctx[17]);
    			set_style(div, "transform", style_transform);
    			set_style(div, "--prop-background-color", /*$bgColor*/ ctx[21] || (/*isDefault*/ ctx[1] ? null : 'transparent'));
    			set_style(div, "--prop-text-color", /*$textColor*/ ctx[22]);
    			set_style(div, "--prop-border-color", /*$borderColor*/ ctx[23]);
    			set_style(div, "--prop-selection-color", /*$selectionColor*/ ctx[24]);

    			set_style(div, "--prop-border-radius", /*$borderRadius*/ ctx[25]
    			? `${/*$borderRadius*/ ctx[25]}px`
    			: /*isDefault*/ ctx[1] ? null : '0px');

    			set_style(div, "--prop-border-width", /*$borderWidth*/ ctx[26] || (/*isDefault*/ ctx[1] ? null : '0px'));
    			add_location(div, file$h, 186, 1, 5062);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[61].bind(div));
    			/*div_binding*/ ctx[62](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "contextmenu", stop_propagation(prevent_default(/*contextmenu_handler*/ ctx[60])), false, true, true, false),
    					listen_dev(div, "keydown", self(prevent_default(/*handleKeydown*/ ctx[48])), false, true, false, false),
    					listen_dev(div, "mouseup", /*onMouseUp*/ ctx[51], false, false, false, false),
    					action_destroyer(/*grabHandle*/ ctx[52].call(null, div))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!/*collapsed*/ ctx[47]) if_block.p(ctx, dirty);

    			if (!current || dirty[0] & /*selected*/ 2048) {
    				toggle_class(div, "selected", /*selected*/ ctx[11]);
    			}

    			if (!current || dirty[0] & /*$locked, $nodeLock*/ 98304) {
    				toggle_class(div, "locked", /*$locked*/ ctx[16] || /*$nodeLock*/ ctx[15]);
    			}

    			if (dirty[0] & /*actualPosition*/ 16384 && style_top !== (style_top = `${/*actualPosition*/ ctx[14].y}px`)) {
    				set_style(div, "top", style_top);
    			}

    			if (dirty[0] & /*actualPosition*/ 16384 && style_left !== (style_left = `${/*actualPosition*/ ctx[14].x}px`)) {
    				set_style(div, "left", style_left);
    			}

    			if (dirty[0] & /*$widthStore*/ 524288 && style_width !== (style_width = `${/*$widthStore*/ ctx[19]}px`)) {
    				set_style(div, "width", style_width);
    			}

    			if (dirty[0] & /*$heightStore*/ 262144 && style_height !== (style_height = `${/*$heightStore*/ ctx[18]}px`)) {
    				set_style(div, "height", style_height);
    			}

    			if (dirty[0] & /*$zIndex*/ 131072) {
    				set_style(div, "z-index", /*$zIndex*/ ctx[17]);
    			}

    			if (dirty[0] & /*$rotation*/ 1048576 && style_transform !== (style_transform = `rotate(${/*$rotation*/ ctx[20]}deg)`)) {
    				set_style(div, "transform", style_transform);
    			}

    			if (dirty[0] & /*$bgColor, isDefault*/ 2097154) {
    				set_style(div, "--prop-background-color", /*$bgColor*/ ctx[21] || (/*isDefault*/ ctx[1] ? null : 'transparent'));
    			}

    			if (dirty[0] & /*$textColor*/ 4194304) {
    				set_style(div, "--prop-text-color", /*$textColor*/ ctx[22]);
    			}

    			if (dirty[0] & /*$borderColor*/ 8388608) {
    				set_style(div, "--prop-border-color", /*$borderColor*/ ctx[23]);
    			}

    			if (dirty[0] & /*$selectionColor*/ 16777216) {
    				set_style(div, "--prop-selection-color", /*$selectionColor*/ ctx[24]);
    			}

    			if (dirty[0] & /*$borderRadius, isDefault*/ 33554434) {
    				set_style(div, "--prop-border-radius", /*$borderRadius*/ ctx[25]
    				? `${/*$borderRadius*/ ctx[25]}px`
    				: /*isDefault*/ ctx[1] ? null : '0px');
    			}

    			if (dirty[0] & /*$borderWidth, isDefault*/ 67108866) {
    				set_style(div, "--prop-border-width", /*$borderWidth*/ ctx[26] || (/*isDefault*/ ctx[1] ? null : '0px'));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			div_resize_listener();
    			/*div_binding*/ ctx[62](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(186:0) {#if !hidden}",
    		ctx
    	});

    	return block;
    }

    // (213:2) {#if !collapsed}
    function create_if_block_1$3(ctx) {
    	let t0;
    	let div0;
    	let div0_id_value;
    	let t1;
    	let div1;
    	let div1_id_value;
    	let t2;
    	let div2;
    	let div2_id_value;
    	let t3;
    	let div3;
    	let div3_id_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[59].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[58], get_default_slot_context$3);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div3 = element("div");
    			attr_dev(div0, "id", div0_id_value = `anchors-west-${/*node*/ ctx[0].id}`);
    			attr_dev(div0, "class", "anchors left svelte-9fi8tt");
    			add_location(div0, file$h, 214, 3, 6053);
    			attr_dev(div1, "id", div1_id_value = `anchors-east-${/*node*/ ctx[0].id}`);
    			attr_dev(div1, "class", "anchors right svelte-9fi8tt");
    			add_location(div1, file$h, 215, 3, 6116);
    			attr_dev(div2, "id", div2_id_value = `anchors-north-${/*node*/ ctx[0].id}`);
    			attr_dev(div2, "class", "anchors top svelte-9fi8tt");
    			add_location(div2, file$h, 216, 3, 6180);
    			attr_dev(div3, "id", div3_id_value = `anchors-south-${/*node*/ ctx[0].id}`);
    			attr_dev(div3, "class", "anchors bottom svelte-9fi8tt");
    			add_location(div3, file$h, 217, 3, 6243);
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*selected*/ 2048 | dirty[1] & /*$$scope*/ 134217728)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[58],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[58])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[58], dirty, get_default_slot_changes$3),
    						get_default_slot_context$3
    					);
    				}
    			}

    			if (!current || dirty[0] & /*node*/ 1 && div0_id_value !== (div0_id_value = `anchors-west-${/*node*/ ctx[0].id}`)) {
    				attr_dev(div0, "id", div0_id_value);
    			}

    			if (!current || dirty[0] & /*node*/ 1 && div1_id_value !== (div1_id_value = `anchors-east-${/*node*/ ctx[0].id}`)) {
    				attr_dev(div1, "id", div1_id_value);
    			}

    			if (!current || dirty[0] & /*node*/ 1 && div2_id_value !== (div2_id_value = `anchors-north-${/*node*/ ctx[0].id}`)) {
    				attr_dev(div2, "id", div2_id_value);
    			}

    			if (!current || dirty[0] & /*node*/ 1 && div3_id_value !== (div3_id_value = `anchors-south-${/*node*/ ctx[0].id}`)) {
    				attr_dev(div3, "id", div3_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(213:2) {#if !collapsed}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*hidden*/ ctx[13] && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*hidden*/ ctx[13]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*hidden*/ 8192) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let actualPosition;
    	let selected;
    	let hidden;
    	let $nodeConnectEvent;
    	let $initialClickPosition;

    	let $cursor,
    		$$unsubscribe_cursor = noop,
    		$$subscribe_cursor = () => ($$unsubscribe_cursor(), $$unsubscribe_cursor = subscribe(cursor, $$value => $$invalidate(67, $cursor = $$value)), cursor);

    	let $groups,
    		$$unsubscribe_groups = noop,
    		$$subscribe_groups = () => ($$unsubscribe_groups(), $$unsubscribe_groups = subscribe(groups, $$value => $$invalidate(68, $groups = $$value)), groups);

    	let $initialNodePositions,
    		$$unsubscribe_initialNodePositions = noop,
    		$$subscribe_initialNodePositions = () => ($$unsubscribe_initialNodePositions(), $$unsubscribe_initialNodePositions = subscribe(initialNodePositions, $$value => $$invalidate(69, $initialNodePositions = $$value)), initialNodePositions);

    	let $selectedNodes;

    	let $activeGroup,
    		$$unsubscribe_activeGroup = noop,
    		$$subscribe_activeGroup = () => ($$unsubscribe_activeGroup(), $$unsubscribe_activeGroup = subscribe(activeGroup, $$value => $$invalidate(70, $activeGroup = $$value)), activeGroup);

    	let $group;

    	let $editing,
    		$$unsubscribe_editing = noop,
    		$$subscribe_editing = () => ($$unsubscribe_editing(), $$unsubscribe_editing = subscribe(editing, $$value => $$invalidate(72, $editing = $$value)), editing);

    	let $editable;
    	let $tracking;
    	let $nodeLock;

    	let $locked,
    		$$unsubscribe_locked = noop,
    		$$subscribe_locked = () => ($$unsubscribe_locked(), $$unsubscribe_locked = subscribe(locked, $$value => $$invalidate(16, $locked = $$value)), locked);

    	let $maxZIndex,
    		$$unsubscribe_maxZIndex = noop,
    		$$subscribe_maxZIndex = () => ($$unsubscribe_maxZIndex(), $$unsubscribe_maxZIndex = subscribe(maxZIndex, $$value => $$invalidate(75, $maxZIndex = $$value)), maxZIndex);

    	let $zIndex;
    	let $graphDOMElement;

    	let $nodeStore,
    		$$unsubscribe_nodeStore = noop,
    		$$subscribe_nodeStore = () => ($$unsubscribe_nodeStore(), $$unsubscribe_nodeStore = subscribe(nodeStore, $$value => $$invalidate(77, $nodeStore = $$value)), nodeStore);

    	let $mounted;
    	let $heightStore;

    	let $centerPoint,
    		$$unsubscribe_centerPoint = noop,
    		$$subscribe_centerPoint = () => ($$unsubscribe_centerPoint(), $$unsubscribe_centerPoint = subscribe(centerPoint, $$value => $$invalidate(79, $centerPoint = $$value)), centerPoint);

    	let $widthStore;
    	let $duplicate;
    	let $hiddenNodes;
    	let $position;
    	let $rotation;
    	let $bgColor;
    	let $textColor;
    	let $borderColor;
    	let $selectionColor;
    	let $borderRadius;
    	let $borderWidth;
    	validate_store(initialClickPosition, 'initialClickPosition');
    	component_subscribe($$self, initialClickPosition, $$value => $$invalidate(66, $initialClickPosition = $$value));
    	validate_store(tracking, 'tracking');
    	component_subscribe($$self, tracking, $$value => $$invalidate(74, $tracking = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_cursor());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_groups());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_initialNodePositions());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_activeGroup());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_editing());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_locked());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_maxZIndex());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_nodeStore());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_centerPoint());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InternalNode', slots, ['default']);
    	const mounted = getContext("mounted");
    	validate_store(mounted, 'mounted');
    	component_subscribe($$self, mounted, value => $$invalidate(78, $mounted = value));
    	const duplicate = getContext("duplicate");
    	validate_store(duplicate, 'duplicate');
    	component_subscribe($$self, duplicate, value => $$invalidate(55, $duplicate = value));
    	const graphDOMElement = getContext("graphDOMElement");
    	validate_store(graphDOMElement, 'graphDOMElement');
    	component_subscribe($$self, graphDOMElement, value => $$invalidate(76, $graphDOMElement = value));
    	const dispatch = createEventDispatcher();
    	let { node } = $$props;
    	let { isDefault } = $$props;
    	let { center } = $$props;
    	let { nodeStore } = $$props;
    	validate_store(nodeStore, 'nodeStore');
    	$$subscribe_nodeStore();
    	let { locked } = $$props;
    	validate_store(locked, 'locked');
    	$$subscribe_locked();
    	let { groups } = $$props;
    	validate_store(groups, 'groups');
    	$$subscribe_groups();
    	let { maxZIndex } = $$props;
    	validate_store(maxZIndex, 'maxZIndex');
    	$$subscribe_maxZIndex();
    	let { centerPoint } = $$props;
    	validate_store(centerPoint, 'centerPoint');
    	$$subscribe_centerPoint();
    	let { cursor } = $$props;
    	validate_store(cursor, 'cursor');
    	$$subscribe_cursor();
    	let { initialNodePositions } = $$props;
    	validate_store(initialNodePositions, 'initialNodePositions');
    	$$subscribe_initialNodePositions();
    	let { activeGroup } = $$props;
    	validate_store(activeGroup, 'activeGroup');
    	$$subscribe_activeGroup();
    	let { editing } = $$props;
    	validate_store(editing, 'editing');
    	$$subscribe_editing();
    	const id = node.id;
    	const position = node.position;
    	validate_store(position, 'position');
    	component_subscribe($$self, position, value => $$invalidate(57, $position = value));
    	const widthStore = node.dimensions.width;
    	validate_store(widthStore, 'widthStore');
    	component_subscribe($$self, widthStore, value => $$invalidate(19, $widthStore = value));
    	const heightStore = node.dimensions.height;
    	validate_store(heightStore, 'heightStore');
    	component_subscribe($$self, heightStore, value => $$invalidate(18, $heightStore = value));
    	const selectionColor = node.selectionColor;
    	validate_store(selectionColor, 'selectionColor');
    	component_subscribe($$self, selectionColor, value => $$invalidate(24, $selectionColor = value));
    	const editable = node.editable;
    	validate_store(editable, 'editable');
    	component_subscribe($$self, editable, value => $$invalidate(73, $editable = value));
    	const nodeLock = node.locked;
    	validate_store(nodeLock, 'nodeLock');
    	component_subscribe($$self, nodeLock, value => $$invalidate(15, $nodeLock = value));
    	const zIndex = node.zIndex;
    	validate_store(zIndex, 'zIndex');
    	component_subscribe($$self, zIndex, value => $$invalidate(17, $zIndex = value));
    	const bgColor = node.bgColor;
    	validate_store(bgColor, 'bgColor');
    	component_subscribe($$self, bgColor, value => $$invalidate(21, $bgColor = value));
    	const borderRadius = node.borderRadius;
    	validate_store(borderRadius, 'borderRadius');
    	component_subscribe($$self, borderRadius, value => $$invalidate(25, $borderRadius = value));
    	const textColor = node.textColor;
    	validate_store(textColor, 'textColor');
    	component_subscribe($$self, textColor, value => $$invalidate(22, $textColor = value));
    	const group = node.group;
    	validate_store(group, 'group');
    	component_subscribe($$self, group, value => $$invalidate(71, $group = value));
    	const borderColor = node.borderColor;
    	validate_store(borderColor, 'borderColor');
    	component_subscribe($$self, borderColor, value => $$invalidate(23, $borderColor = value));
    	const borderWidth = node.borderWidth;
    	validate_store(borderWidth, 'borderWidth');
    	component_subscribe($$self, borderWidth, value => $$invalidate(26, $borderWidth = value));
    	const rotation = node.rotation;
    	validate_store(rotation, 'rotation');
    	component_subscribe($$self, rotation, value => $$invalidate(20, $rotation = value));
    	const { selected: selectedNodeGroup, hidden: hiddenNodesGroup } = $groups;
    	const hiddenNodes = hiddenNodesGroup.nodes;
    	validate_store(hiddenNodes, 'hiddenNodes');
    	component_subscribe($$self, hiddenNodes, value => $$invalidate(56, $hiddenNodes = value));
    	const selectedNodes = selectedNodeGroup.nodes;
    	validate_store(selectedNodes, 'selectedNodes');
    	component_subscribe($$self, selectedNodes, value => $$invalidate(54, $selectedNodes = value));
    	let collapsed = false;
    	let minWidth = 200;
    	let minHeight = 100;
    	let DOMnode;
    	setContext("node", node);

    	onMount(() => {
    		if (!$widthStore && !$heightStore) {
    			[minWidth, minHeight] = calculateFitContentWidth(DOMnode);
    			set_store_value(widthStore, $widthStore = minWidth, $widthStore);
    			set_store_value(heightStore, $heightStore = minHeight, $heightStore);
    		}

    		if (center) {
    			const opticalCenter = {
    				x: $centerPoint.x - $widthStore / 2,
    				y: $centerPoint.y - $heightStore / 2
    			};

    			node.position.set(opticalCenter);
    			tracking.set(true);
    			tracking.set(false);
    		}

    		set_store_value(mounted, $mounted++, $mounted);
    	});

    	onDestroy(() => {
    		if (selected) {
    			$selectedNodes.delete(node);
    			selectedNodes.set($selectedNodes);
    		}

    		set_store_value(mounted, $mounted--, $mounted);
    	});

    	function toggleSelected() {
    		if (selected) {
    			if (node) $selectedNodes.delete(node);
    			selectedNodes.set($selectedNodes);
    		} else {
    			if (node) $selectedNodes.add(node);
    			selectedNodes.set($selectedNodes);
    		}
    	}

    	function handleKeydown(e) {
    		if (e.key === "Enter") {
    			toggleSelected();
    		} else if (e.key === "Backspace") {
    			$nodeStore.delete(node.id);
    			nodeStore.set($nodeStore);
    		}
    	}

    	function handleNodeTouch(e) {
    		$graphDOMElement.focus();
    		e.stopPropagation();
    		e.preventDefault();
    		if (e.touches.length > 1) return;
    		if ($locked || $nodeLock) return;
    		if ($zIndex !== $maxZIndex && $zIndex !== Infinity) set_store_value(zIndex, $zIndex = set_store_value(maxZIndex, ++$maxZIndex, $maxZIndex), $zIndex);
    		dispatch("nodeClicked", { node, e });
    		set_store_value(initialClickPosition, $initialClickPosition = $cursor, $initialClickPosition);
    		nodeSelectLogic(e);
    	}

    	function handleNodeClicked(e) {
    		$graphDOMElement.focus();
    		const targetElement = e.target;
    		if ($zIndex !== $maxZIndex && $zIndex !== Infinity) set_store_value(zIndex, $zIndex = set_store_value(maxZIndex, ++$maxZIndex, $maxZIndex), $zIndex);
    		if (targetElement.tagName === "INPUT") return;
    		dispatch("nodeClicked", { node, e });
    		e.stopPropagation();
    		e.preventDefault();
    		if ($locked || $nodeLock) return;
    		set_store_value(tracking, $tracking = true, $tracking);
    		set_store_value(initialClickPosition, $initialClickPosition = $cursor, $initialClickPosition);

    		if (e.button === 2 && $editable) {
    			set_store_value(editing, $editing = node, $editing);
    		}

    		nodeSelectLogic(e);
    	}

    	function nodeSelectLogic(e) {
    		let groupData;
    		let parent;
    		let isParent = false;
    		const nodeGroup = $group;

    		if (nodeGroup) {
    			groupData = $groups[nodeGroup];
    			parent = get_store_value(groupData.parent);
    			isParent = parent === node;
    		}

    		if (isParent) {
    			set_store_value(activeGroup, $activeGroup = nodeGroup, $activeGroup);
    		} else {
    			set_store_value(activeGroup, $activeGroup = "selected", $activeGroup);
    		}

    		if (!e.shiftKey && selected) {
    			set_store_value(activeGroup, $activeGroup = "selected", $activeGroup);
    		} else {
    			if (!e.shiftKey && !selected && !e.shiftKey) {
    				$selectedNodes.clear();
    				selectedNodes.set($selectedNodes);
    			}

    			toggleSelected();
    		}

    		set_store_value(initialNodePositions, $initialNodePositions = captureGroup($groups["selected"].nodes), $initialNodePositions);
    	}

    	function destroy() {
    		nodeStore.delete(id);
    	}

    	const nodeConnectEvent = writable(null);
    	validate_store(nodeConnectEvent, 'nodeConnectEvent');
    	component_subscribe($$self, nodeConnectEvent, value => $$invalidate(65, $nodeConnectEvent = value));
    	setContext("nodeConnectEvent", nodeConnectEvent);

    	function onMouseUp(e) {
    		const mouseDeltaX = $cursor.x - $initialClickPosition.x;
    		const mouseDeltaY = $cursor.y - $initialClickPosition.y;
    		const combinedDelta = Math.abs(mouseDeltaX) + Math.abs(mouseDeltaY);
    		if (combinedDelta < 4) dispatch("nodeReleased", { e });
    		set_store_value(nodeConnectEvent, $nodeConnectEvent = e, $nodeConnectEvent);
    	}

    	function grabHandle(node2) {
    		node2.addEventListener("mousedown", handleNodeClicked);
    		node2.addEventListener("touchstart", handleNodeTouch);

    		return {
    			destroy() {
    				node2.removeEventListener("mousedown", handleNodeClicked);
    				node2.removeEventListener("touchstart", handleNodeTouch);
    			}
    		};
    	}

    	$$self.$$.on_mount.push(function () {
    		if (node === undefined && !('node' in $$props || $$self.$$.bound[$$self.$$.props['node']])) {
    			console.warn("<InternalNode> was created without expected prop 'node'");
    		}

    		if (isDefault === undefined && !('isDefault' in $$props || $$self.$$.bound[$$self.$$.props['isDefault']])) {
    			console.warn("<InternalNode> was created without expected prop 'isDefault'");
    		}

    		if (center === undefined && !('center' in $$props || $$self.$$.bound[$$self.$$.props['center']])) {
    			console.warn("<InternalNode> was created without expected prop 'center'");
    		}

    		if (nodeStore === undefined && !('nodeStore' in $$props || $$self.$$.bound[$$self.$$.props['nodeStore']])) {
    			console.warn("<InternalNode> was created without expected prop 'nodeStore'");
    		}

    		if (locked === undefined && !('locked' in $$props || $$self.$$.bound[$$self.$$.props['locked']])) {
    			console.warn("<InternalNode> was created without expected prop 'locked'");
    		}

    		if (groups === undefined && !('groups' in $$props || $$self.$$.bound[$$self.$$.props['groups']])) {
    			console.warn("<InternalNode> was created without expected prop 'groups'");
    		}

    		if (maxZIndex === undefined && !('maxZIndex' in $$props || $$self.$$.bound[$$self.$$.props['maxZIndex']])) {
    			console.warn("<InternalNode> was created without expected prop 'maxZIndex'");
    		}

    		if (centerPoint === undefined && !('centerPoint' in $$props || $$self.$$.bound[$$self.$$.props['centerPoint']])) {
    			console.warn("<InternalNode> was created without expected prop 'centerPoint'");
    		}

    		if (cursor === undefined && !('cursor' in $$props || $$self.$$.bound[$$self.$$.props['cursor']])) {
    			console.warn("<InternalNode> was created without expected prop 'cursor'");
    		}

    		if (initialNodePositions === undefined && !('initialNodePositions' in $$props || $$self.$$.bound[$$self.$$.props['initialNodePositions']])) {
    			console.warn("<InternalNode> was created without expected prop 'initialNodePositions'");
    		}

    		if (activeGroup === undefined && !('activeGroup' in $$props || $$self.$$.bound[$$self.$$.props['activeGroup']])) {
    			console.warn("<InternalNode> was created without expected prop 'activeGroup'");
    		}

    		if (editing === undefined && !('editing' in $$props || $$self.$$.bound[$$self.$$.props['editing']])) {
    			console.warn("<InternalNode> was created without expected prop 'editing'");
    		}
    	});

    	const writable_props = [
    		'node',
    		'isDefault',
    		'center',
    		'nodeStore',
    		'locked',
    		'groups',
    		'maxZIndex',
    		'centerPoint',
    		'cursor',
    		'initialNodePositions',
    		'activeGroup',
    		'editing'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InternalNode> was created with unknown prop '${key}'`);
    	});

    	function contextmenu_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function div_elementresize_handler() {
    		$widthStore = this.clientWidth;
    		widthStore.set($widthStore);
    		$heightStore = this.clientHeight;
    		heightStore.set($heightStore);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			DOMnode = $$value;
    			$$invalidate(12, DOMnode);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('node' in $$props) $$invalidate(0, node = $$props.node);
    		if ('isDefault' in $$props) $$invalidate(1, isDefault = $$props.isDefault);
    		if ('center' in $$props) $$invalidate(53, center = $$props.center);
    		if ('nodeStore' in $$props) $$subscribe_nodeStore($$invalidate(2, nodeStore = $$props.nodeStore));
    		if ('locked' in $$props) $$subscribe_locked($$invalidate(3, locked = $$props.locked));
    		if ('groups' in $$props) $$subscribe_groups($$invalidate(4, groups = $$props.groups));
    		if ('maxZIndex' in $$props) $$subscribe_maxZIndex($$invalidate(5, maxZIndex = $$props.maxZIndex));
    		if ('centerPoint' in $$props) $$subscribe_centerPoint($$invalidate(6, centerPoint = $$props.centerPoint));
    		if ('cursor' in $$props) $$subscribe_cursor($$invalidate(7, cursor = $$props.cursor));
    		if ('initialNodePositions' in $$props) $$subscribe_initialNodePositions($$invalidate(8, initialNodePositions = $$props.initialNodePositions));
    		if ('activeGroup' in $$props) $$subscribe_activeGroup($$invalidate(9, activeGroup = $$props.activeGroup));
    		if ('editing' in $$props) $$subscribe_editing($$invalidate(10, editing = $$props.editing));
    		if ('$$scope' in $$props) $$invalidate(58, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		initialClickPosition,
    		tracking,
    		captureGroup,
    		calculateFitContentWidth,
    		getContext,
    		onDestroy,
    		onMount,
    		setContext,
    		createEventDispatcher,
    		get: get_store_value,
    		mounted,
    		duplicate,
    		graphDOMElement,
    		dispatch,
    		node,
    		isDefault,
    		center,
    		nodeStore,
    		locked,
    		groups,
    		maxZIndex,
    		centerPoint,
    		cursor,
    		initialNodePositions,
    		activeGroup,
    		editing,
    		id,
    		position,
    		widthStore,
    		heightStore,
    		selectionColor,
    		editable,
    		nodeLock,
    		zIndex,
    		bgColor,
    		borderRadius,
    		textColor,
    		group,
    		borderColor,
    		borderWidth,
    		rotation,
    		selectedNodeGroup,
    		hiddenNodesGroup,
    		hiddenNodes,
    		selectedNodes,
    		collapsed,
    		minWidth,
    		minHeight,
    		DOMnode,
    		toggleSelected,
    		handleKeydown,
    		handleNodeTouch,
    		handleNodeClicked,
    		nodeSelectLogic,
    		destroy,
    		writable,
    		nodeConnectEvent,
    		onMouseUp,
    		grabHandle,
    		selected,
    		hidden,
    		actualPosition,
    		$nodeConnectEvent,
    		$initialClickPosition,
    		$cursor,
    		$groups,
    		$initialNodePositions,
    		$selectedNodes,
    		$activeGroup,
    		$group,
    		$editing,
    		$editable,
    		$tracking,
    		$nodeLock,
    		$locked,
    		$maxZIndex,
    		$zIndex,
    		$graphDOMElement,
    		$nodeStore,
    		$mounted,
    		$heightStore,
    		$centerPoint,
    		$widthStore,
    		$duplicate,
    		$hiddenNodes,
    		$position,
    		$rotation,
    		$bgColor,
    		$textColor,
    		$borderColor,
    		$selectionColor,
    		$borderRadius,
    		$borderWidth
    	});

    	$$self.$inject_state = $$props => {
    		if ('node' in $$props) $$invalidate(0, node = $$props.node);
    		if ('isDefault' in $$props) $$invalidate(1, isDefault = $$props.isDefault);
    		if ('center' in $$props) $$invalidate(53, center = $$props.center);
    		if ('nodeStore' in $$props) $$subscribe_nodeStore($$invalidate(2, nodeStore = $$props.nodeStore));
    		if ('locked' in $$props) $$subscribe_locked($$invalidate(3, locked = $$props.locked));
    		if ('groups' in $$props) $$subscribe_groups($$invalidate(4, groups = $$props.groups));
    		if ('maxZIndex' in $$props) $$subscribe_maxZIndex($$invalidate(5, maxZIndex = $$props.maxZIndex));
    		if ('centerPoint' in $$props) $$subscribe_centerPoint($$invalidate(6, centerPoint = $$props.centerPoint));
    		if ('cursor' in $$props) $$subscribe_cursor($$invalidate(7, cursor = $$props.cursor));
    		if ('initialNodePositions' in $$props) $$subscribe_initialNodePositions($$invalidate(8, initialNodePositions = $$props.initialNodePositions));
    		if ('activeGroup' in $$props) $$subscribe_activeGroup($$invalidate(9, activeGroup = $$props.activeGroup));
    		if ('editing' in $$props) $$subscribe_editing($$invalidate(10, editing = $$props.editing));
    		if ('collapsed' in $$props) $$invalidate(47, collapsed = $$props.collapsed);
    		if ('minWidth' in $$props) minWidth = $$props.minWidth;
    		if ('minHeight' in $$props) minHeight = $$props.minHeight;
    		if ('DOMnode' in $$props) $$invalidate(12, DOMnode = $$props.DOMnode);
    		if ('selected' in $$props) $$invalidate(11, selected = $$props.selected);
    		if ('hidden' in $$props) $$invalidate(13, hidden = $$props.hidden);
    		if ('actualPosition' in $$props) $$invalidate(14, actualPosition = $$props.actualPosition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$position*/ 67108864) {
    			$$invalidate(14, actualPosition = $position);
    		}

    		if ($$self.$$.dirty[0] & /*node*/ 1 | $$self.$$.dirty[1] & /*$selectedNodes*/ 8388608) {
    			$$invalidate(11, selected = $selectedNodes.has(node));
    		}

    		if ($$self.$$.dirty[0] & /*node*/ 1 | $$self.$$.dirty[1] & /*$hiddenNodes*/ 33554432) {
    			$$invalidate(13, hidden = $hiddenNodes.has(node));
    		}

    		if ($$self.$$.dirty[0] & /*selected, node*/ 2049 | $$self.$$.dirty[1] & /*$duplicate*/ 16777216) {
    			if (selected && $duplicate) {
    				dispatch("duplicate", node);
    			}
    		}
    	};

    	return [
    		node,
    		isDefault,
    		nodeStore,
    		locked,
    		groups,
    		maxZIndex,
    		centerPoint,
    		cursor,
    		initialNodePositions,
    		activeGroup,
    		editing,
    		selected,
    		DOMnode,
    		hidden,
    		actualPosition,
    		$nodeLock,
    		$locked,
    		$zIndex,
    		$heightStore,
    		$widthStore,
    		$rotation,
    		$bgColor,
    		$textColor,
    		$borderColor,
    		$selectionColor,
    		$borderRadius,
    		$borderWidth,
    		mounted,
    		duplicate,
    		graphDOMElement,
    		id,
    		position,
    		widthStore,
    		heightStore,
    		selectionColor,
    		editable,
    		nodeLock,
    		zIndex,
    		bgColor,
    		borderRadius,
    		textColor,
    		group,
    		borderColor,
    		borderWidth,
    		rotation,
    		hiddenNodes,
    		selectedNodes,
    		collapsed,
    		handleKeydown,
    		destroy,
    		nodeConnectEvent,
    		onMouseUp,
    		grabHandle,
    		center,
    		$selectedNodes,
    		$duplicate,
    		$hiddenNodes,
    		$position,
    		$$scope,
    		slots,
    		contextmenu_handler,
    		div_elementresize_handler,
    		div_binding
    	];
    }

    class InternalNode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$o,
    			create_fragment$o,
    			safe_not_equal,
    			{
    				node: 0,
    				isDefault: 1,
    				center: 53,
    				nodeStore: 2,
    				locked: 3,
    				groups: 4,
    				maxZIndex: 5,
    				centerPoint: 6,
    				cursor: 7,
    				initialNodePositions: 8,
    				activeGroup: 9,
    				editing: 10
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InternalNode",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get node() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isDefault() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDefault(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nodeStore() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodeStore(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get locked() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set locked(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groups() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groups(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxZIndex() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxZIndex(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get centerPoint() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set centerPoint(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cursor() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cursor(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get initialNodePositions() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialNodePositions(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeGroup() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeGroup(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editing() {
    		throw new Error("<InternalNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editing(value) {
    		throw new Error("<InternalNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Node/Node.svelte generated by Svelte v3.58.0 */

    const get_default_slot_changes$2 = dirty => ({
    	selected: dirty[1] & /*selected*/ 16384,
    	grabHandle: dirty[1] & /*grabHandle*/ 32768,
    	node: dirty[0] & /*node*/ 4,
    	destroy: dirty[1] & /*destroy*/ 8192
    });

    const get_default_slot_context$2 = ctx => ({
    	selected: /*selected*/ ctx[45],
    	grabHandle: /*grabHandle*/ ctx[46],
    	disconnect: /*disconnect*/ ctx[8],
    	connect: /*connect*/ ctx[7],
    	node: /*node*/ ctx[2],
    	destroy: /*destroy*/ ctx[44]
    });

    // (180:0) {#if node && $nodes.get(node.id)}
    function create_if_block$9(ctx) {
    	let internalnode;
    	let current;

    	internalnode = new InternalNode({
    			props: {
    				node: /*node*/ ctx[2],
    				center: /*center*/ ctx[1],
    				isDefault: /*isDefault*/ ctx[3] || /*useDefaults*/ ctx[0],
    				nodeStore: /*graph*/ ctx[5].nodes,
    				locked: /*graph*/ ctx[5].locked,
    				groups: /*graph*/ ctx[5].groups,
    				maxZIndex: /*graph*/ ctx[5].maxZIndex,
    				centerPoint: /*graph*/ ctx[5].center,
    				cursor: /*graph*/ ctx[5].cursor,
    				activeGroup: /*graph*/ ctx[5].activeGroup,
    				editing: /*graph*/ ctx[5].editing,
    				initialNodePositions: /*graph*/ ctx[5].initialNodePositions,
    				$$slots: {
    					default: [
    						create_default_slot$6,
    						({ destroy, selected, grabHandle }) => ({
    							44: destroy,
    							45: selected,
    							46: grabHandle
    						}),
    						({ destroy, selected, grabHandle }) => [
    							0,
    							(destroy ? 8192 : 0) | (selected ? 16384 : 0) | (grabHandle ? 32768 : 0)
    						]
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	internalnode.$on("nodeClicked", /*nodeClicked_handler*/ ctx[36]);
    	internalnode.$on("nodeMount", /*nodeMount_handler*/ ctx[37]);
    	internalnode.$on("nodeReleased", /*nodeReleased_handler*/ ctx[38]);
    	internalnode.$on("duplicate", /*duplicate_handler*/ ctx[39]);

    	const block = {
    		c: function create() {
    			create_component(internalnode.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(internalnode, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const internalnode_changes = {};
    			if (dirty[0] & /*node*/ 4) internalnode_changes.node = /*node*/ ctx[2];
    			if (dirty[0] & /*center*/ 2) internalnode_changes.center = /*center*/ ctx[1];
    			if (dirty[0] & /*isDefault, useDefaults*/ 9) internalnode_changes.isDefault = /*isDefault*/ ctx[3] || /*useDefaults*/ ctx[0];

    			if (dirty[0] & /*node*/ 4 | dirty[1] & /*$$scope, selected, grabHandle, destroy*/ 57856) {
    				internalnode_changes.$$scope = { dirty, ctx };
    			}

    			internalnode.$set(internalnode_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(internalnode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(internalnode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(internalnode, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(180:0) {#if node && $nodes.get(node.id)}",
    		ctx
    	});

    	return block;
    }

    // (202:72)     
    function fallback_block$2(ctx) {
    	let defaultnode;
    	let current;

    	defaultnode = new DefaultNode({
    			props: { selected: /*selected*/ ctx[45] },
    			$$inline: true
    		});

    	defaultnode.$on("connection", /*connection_handler*/ ctx[34]);
    	defaultnode.$on("disconnection", /*disconnection_handler*/ ctx[35]);

    	const block = {
    		c: function create() {
    			create_component(defaultnode.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(defaultnode, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const defaultnode_changes = {};
    			if (dirty[1] & /*selected*/ 16384) defaultnode_changes.selected = /*selected*/ ctx[45];
    			defaultnode.$set(defaultnode_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defaultnode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defaultnode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(defaultnode, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$2.name,
    		type: "fallback",
    		source: "(202:72)     ",
    		ctx
    	});

    	return block;
    }

    // (181:1) <InternalNode   {node}   {center}   isDefault={isDefault || useDefaults}   nodeStore={graph.nodes}   locked={graph.locked}   groups={graph.groups}   maxZIndex={graph.maxZIndex}   centerPoint={graph.center}   cursor={graph.cursor}   activeGroup={graph.activeGroup}   editing={graph.editing}   initialNodePositions={graph.initialNodePositions}   on:nodeClicked   on:nodeMount   on:nodeReleased   on:duplicate   let:destroy   let:selected   let:grabHandle  >
    function create_default_slot$6(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[33].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[40], get_default_slot_context$2);
    	const default_slot_or_fallback = default_slot || fallback_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*node*/ 4 | dirty[1] & /*$$scope, selected, grabHandle, destroy*/ 57856)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[40],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[40])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[40], dirty, get_default_slot_changes$2),
    						get_default_slot_context$2
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[1] & /*selected*/ 16384)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1] : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(181:1) <InternalNode   {node}   {center}   isDefault={isDefault || useDefaults}   nodeStore={graph.nodes}   locked={graph.locked}   groups={graph.groups}   maxZIndex={graph.maxZIndex}   centerPoint={graph.center}   cursor={graph.cursor}   activeGroup={graph.activeGroup}   editing={graph.editing}   initialNodePositions={graph.initialNodePositions}   on:nodeClicked   on:nodeMount   on:nodeReleased   on:duplicate   let:destroy   let:selected   let:grabHandle  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let show_if = /*node*/ ctx[2] && /*$nodes*/ ctx[4].get(/*node*/ ctx[2].id);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*node, $nodes*/ 20) show_if = /*node*/ ctx[2] && /*$nodes*/ ctx[4].get(/*node*/ ctx[2].id);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*node, $nodes*/ 20) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$9(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let $nodes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Node', slots, ['default']);
    	const $$slots = compute_slots(slots);
    	const graph = getContext("graph");
    	const group = getContext("group");
    	let { position = { x: 0, y: 0 } } = $$props;
    	let { dimensions = null } = $$props;
    	let { id = 0 } = $$props;
    	let { bgColor = null } = $$props;
    	let { borderRadius = null } = $$props;
    	let { borderColor = null } = $$props;
    	let { borderWidth = null } = $$props;
    	let { selectionColor = null } = $$props;
    	let { textColor = null } = $$props;
    	let { resizable = false } = $$props;
    	let { label = "" } = $$props;
    	let { inputs = 1 } = $$props;
    	let { outputs = 1 } = $$props;
    	let { width = null } = $$props;
    	let { height = null } = $$props;
    	let { TD = false } = $$props;
    	let { LR = false } = $$props;
    	let { zIndex = 1 } = $$props;
    	let { editable = false } = $$props;
    	let { locked = false } = $$props;
    	let { rotation = 0 } = $$props;
    	let { edge = null } = $$props;
    	let { connections = [] } = $$props;
    	let { useDefaults = false } = $$props;
    	let { center = false } = $$props;
    	let { dynamic = false } = $$props;
    	const nodes = graph.nodes;
    	validate_store(nodes, 'nodes');
    	component_subscribe($$self, nodes, value => $$invalidate(4, $nodes = value));
    	setContext("dynamic", dynamic);
    	let node;
    	let isDefault = true;

    	onMount(() => {
    		const direction = TD ? "TD" : LR ? "LR" : graph.direction;
    		const groupBox = graph.groupBoxes.get(group);
    		const nodeCount = graph.nodes.count() + 1;
    		$$invalidate(3, isDefault = !$$slots.default);

    		const initialDimensions = dimensions
    		? dimensions
    		: width || height
    			? {
    					width: width || height || 200,
    					height: height || width || 100
    				}
    			: isDefault
    				? { width: 200, height: 100 }
    				: { width: 0, height: 0 };

    		const config = {
    			id: id || nodeCount,
    			position: groupBox
    			? {
    					x: get_store_value(groupBox.position).x + position.x,
    					y: get_store_value(groupBox.position).y + position.y
    				}
    			: position,
    			dimensions: initialDimensions,
    			editable: editable || graph.editable,
    			label,
    			group,
    			resizable,
    			inputs,
    			outputs,
    			zIndex,
    			direction,
    			locked,
    			rotation
    		};

    		if (connections.length && outputs) config.connections = processConnections(connections);
    		if (borderWidth) config.borderWidth = borderWidth;
    		if (borderRadius) config.borderRadius = borderRadius;
    		if (borderColor) config.borderColor = borderColor;
    		if (selectionColor) config.selectionColor = selectionColor;
    		if (textColor) config.textColor = textColor;
    		if (bgColor) config.bgColor = bgColor;
    		if (edge) config.edge = edge;
    		$$invalidate(2, node = createNode(config));

    		if (groupBox) {
    			graph.groups.update(groups => {
    				const nodes2 = get_store_value(groups[group].nodes);
    				groups[group].nodes.set(/* @__PURE__ */ new Set([...nodes2, node]));
    				return groups;
    			});
    		}

    		graph.nodes.add(node, node.id);
    	});

    	function processConnections(connectionsArray) {
    		const processedConnections = Array(outputs).fill(null).map(() => []);
    		let currentAnchor = 0;

    		connectionsArray.forEach(connection => {
    			currentAnchor = currentAnchor % outputs;
    			processedConnections[currentAnchor].push(connection);
    			currentAnchor++;
    		});

    		return processedConnections.reverse();
    	}

    	function connect(connections2) {
    		if (!node) return;

    		const adjustedConnections = Array.isArray(connections2)
    		? connections2
    		: [connections2];

    		const processedConnections = processConnections(adjustedConnections);
    		node.connections.set(processedConnections);
    	}

    	function disconnect(connections2) {
    		if (!node) return;

    		const adjustedConnections = Array.isArray(connections2)
    		? connections2
    		: [connections2];

    		adjustedConnections.forEach(connection => {
    			const [nodeId, anchorId] = Array.isArray(connection)
    			? connection
    			: [connection, null];

    			const nodeKey = `N-${nodeId}`;
    			const otherNode = graph.nodes.get(nodeKey);
    			if (!otherNode) return;
    			let specificAnchor = null;
    			const anchorKey = anchorId ? `A-${anchorId}/${nodeKey}` : null;

    			if (anchorKey) {
    				specificAnchor = otherNode.anchors.get(anchorKey);
    			}

    			const matchingEdgeKeys = graph.edges.match(node, otherNode, specificAnchor);
    			if (matchingEdgeKeys.length) graph.edges.delete(matchingEdgeKeys[matchingEdgeKeys.length - 1]);
    		});
    	}

    	setContext("connect", connect);
    	setContext("disconnect", disconnect);

    	const writable_props = [
    		'position',
    		'dimensions',
    		'id',
    		'bgColor',
    		'borderRadius',
    		'borderColor',
    		'borderWidth',
    		'selectionColor',
    		'textColor',
    		'resizable',
    		'label',
    		'inputs',
    		'outputs',
    		'width',
    		'height',
    		'TD',
    		'LR',
    		'zIndex',
    		'editable',
    		'locked',
    		'rotation',
    		'edge',
    		'connections',
    		'useDefaults',
    		'center',
    		'dynamic'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Node> was created with unknown prop '${key}'`);
    	});

    	function connection_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function disconnection_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function nodeClicked_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function nodeMount_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function nodeReleased_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function duplicate_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('position' in $$props) $$invalidate(9, position = $$props.position);
    		if ('dimensions' in $$props) $$invalidate(10, dimensions = $$props.dimensions);
    		if ('id' in $$props) $$invalidate(11, id = $$props.id);
    		if ('bgColor' in $$props) $$invalidate(12, bgColor = $$props.bgColor);
    		if ('borderRadius' in $$props) $$invalidate(13, borderRadius = $$props.borderRadius);
    		if ('borderColor' in $$props) $$invalidate(14, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(15, borderWidth = $$props.borderWidth);
    		if ('selectionColor' in $$props) $$invalidate(16, selectionColor = $$props.selectionColor);
    		if ('textColor' in $$props) $$invalidate(17, textColor = $$props.textColor);
    		if ('resizable' in $$props) $$invalidate(18, resizable = $$props.resizable);
    		if ('label' in $$props) $$invalidate(19, label = $$props.label);
    		if ('inputs' in $$props) $$invalidate(20, inputs = $$props.inputs);
    		if ('outputs' in $$props) $$invalidate(21, outputs = $$props.outputs);
    		if ('width' in $$props) $$invalidate(22, width = $$props.width);
    		if ('height' in $$props) $$invalidate(23, height = $$props.height);
    		if ('TD' in $$props) $$invalidate(24, TD = $$props.TD);
    		if ('LR' in $$props) $$invalidate(25, LR = $$props.LR);
    		if ('zIndex' in $$props) $$invalidate(26, zIndex = $$props.zIndex);
    		if ('editable' in $$props) $$invalidate(27, editable = $$props.editable);
    		if ('locked' in $$props) $$invalidate(28, locked = $$props.locked);
    		if ('rotation' in $$props) $$invalidate(29, rotation = $$props.rotation);
    		if ('edge' in $$props) $$invalidate(30, edge = $$props.edge);
    		if ('connections' in $$props) $$invalidate(31, connections = $$props.connections);
    		if ('useDefaults' in $$props) $$invalidate(0, useDefaults = $$props.useDefaults);
    		if ('center' in $$props) $$invalidate(1, center = $$props.center);
    		if ('dynamic' in $$props) $$invalidate(32, dynamic = $$props.dynamic);
    		if ('$$scope' in $$props) $$invalidate(40, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		InternalNode,
    		DefaultNode,
    		get: get_store_value,
    		createNode,
    		getContext,
    		onMount,
    		setContext,
    		graph,
    		group,
    		position,
    		dimensions,
    		id,
    		bgColor,
    		borderRadius,
    		borderColor,
    		borderWidth,
    		selectionColor,
    		textColor,
    		resizable,
    		label,
    		inputs,
    		outputs,
    		width,
    		height,
    		TD,
    		LR,
    		zIndex,
    		editable,
    		locked,
    		rotation,
    		edge,
    		connections,
    		useDefaults,
    		center,
    		dynamic,
    		nodes,
    		node,
    		isDefault,
    		processConnections,
    		connect,
    		disconnect,
    		$nodes
    	});

    	$$self.$inject_state = $$props => {
    		if ('position' in $$props) $$invalidate(9, position = $$props.position);
    		if ('dimensions' in $$props) $$invalidate(10, dimensions = $$props.dimensions);
    		if ('id' in $$props) $$invalidate(11, id = $$props.id);
    		if ('bgColor' in $$props) $$invalidate(12, bgColor = $$props.bgColor);
    		if ('borderRadius' in $$props) $$invalidate(13, borderRadius = $$props.borderRadius);
    		if ('borderColor' in $$props) $$invalidate(14, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(15, borderWidth = $$props.borderWidth);
    		if ('selectionColor' in $$props) $$invalidate(16, selectionColor = $$props.selectionColor);
    		if ('textColor' in $$props) $$invalidate(17, textColor = $$props.textColor);
    		if ('resizable' in $$props) $$invalidate(18, resizable = $$props.resizable);
    		if ('label' in $$props) $$invalidate(19, label = $$props.label);
    		if ('inputs' in $$props) $$invalidate(20, inputs = $$props.inputs);
    		if ('outputs' in $$props) $$invalidate(21, outputs = $$props.outputs);
    		if ('width' in $$props) $$invalidate(22, width = $$props.width);
    		if ('height' in $$props) $$invalidate(23, height = $$props.height);
    		if ('TD' in $$props) $$invalidate(24, TD = $$props.TD);
    		if ('LR' in $$props) $$invalidate(25, LR = $$props.LR);
    		if ('zIndex' in $$props) $$invalidate(26, zIndex = $$props.zIndex);
    		if ('editable' in $$props) $$invalidate(27, editable = $$props.editable);
    		if ('locked' in $$props) $$invalidate(28, locked = $$props.locked);
    		if ('rotation' in $$props) $$invalidate(29, rotation = $$props.rotation);
    		if ('edge' in $$props) $$invalidate(30, edge = $$props.edge);
    		if ('connections' in $$props) $$invalidate(31, connections = $$props.connections);
    		if ('useDefaults' in $$props) $$invalidate(0, useDefaults = $$props.useDefaults);
    		if ('center' in $$props) $$invalidate(1, center = $$props.center);
    		if ('dynamic' in $$props) $$invalidate(32, dynamic = $$props.dynamic);
    		if ('node' in $$props) $$invalidate(2, node = $$props.node);
    		if ('isDefault' in $$props) $$invalidate(3, isDefault = $$props.isDefault);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*node, bgColor*/ 4100) {
    			if (node) {
    				node.bgColor.set(bgColor);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, label*/ 524292) {
    			if (node) {
    				node.label.set(label);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, textColor*/ 131076) {
    			if (node) {
    				node.textColor.set(textColor);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, borderColor*/ 16388) {
    			if (node) {
    				node.borderColor.set(borderColor);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, selectionColor*/ 65540) {
    			if (node) {
    				node.selectionColor.set(selectionColor);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, resizable*/ 262148) {
    			if (node) {
    				node.resizable.set(resizable);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, editable*/ 134217732) {
    			if (node) {
    				node.editable.set(editable);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, locked*/ 268435460) {
    			if (node) {
    				node.locked.set(locked);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, inputs*/ 1048580) {
    			if (node) {
    				node.inputs.set(inputs);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, outputs*/ 2097156) {
    			if (node) {
    				node.outputs.set(outputs);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, zIndex*/ 67108868) {
    			if (node) {
    				node.zIndex.set(zIndex);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, inputs*/ 1048580) {
    			if (node) {
    				node.inputs.set(inputs);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*node, outputs*/ 2097156) {
    			if (node) {
    				node.outputs.set(outputs);
    			}
    		}
    	};

    	return [
    		useDefaults,
    		center,
    		node,
    		isDefault,
    		$nodes,
    		graph,
    		nodes,
    		connect,
    		disconnect,
    		position,
    		dimensions,
    		id,
    		bgColor,
    		borderRadius,
    		borderColor,
    		borderWidth,
    		selectionColor,
    		textColor,
    		resizable,
    		label,
    		inputs,
    		outputs,
    		width,
    		height,
    		TD,
    		LR,
    		zIndex,
    		editable,
    		locked,
    		rotation,
    		edge,
    		connections,
    		dynamic,
    		slots,
    		connection_handler,
    		disconnection_handler,
    		nodeClicked_handler,
    		nodeMount_handler,
    		nodeReleased_handler,
    		duplicate_handler,
    		$$scope
    	];
    }

    class Node extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$n,
    			create_fragment$n,
    			safe_not_equal,
    			{
    				position: 9,
    				dimensions: 10,
    				id: 11,
    				bgColor: 12,
    				borderRadius: 13,
    				borderColor: 14,
    				borderWidth: 15,
    				selectionColor: 16,
    				textColor: 17,
    				resizable: 18,
    				label: 19,
    				inputs: 20,
    				outputs: 21,
    				width: 22,
    				height: 23,
    				TD: 24,
    				LR: 25,
    				zIndex: 26,
    				editable: 27,
    				locked: 28,
    				rotation: 29,
    				edge: 30,
    				connections: 31,
    				useDefaults: 0,
    				center: 1,
    				dynamic: 32
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Node",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get position() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dimensions() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dimensions(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderRadius() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderRadius(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderWidth() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderWidth(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectionColor() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectionColor(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get resizable() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resizable(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputs() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputs(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputs() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputs(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get TD() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set TD(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get LR() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set LR(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zIndex() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zIndex(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editable() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editable(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get locked() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set locked(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotation() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotation(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edge() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edge(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get connections() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set connections(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useDefaults() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useDefaults(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dynamic() {
    		throw new Error("<Node>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dynamic(value) {
    		throw new Error("<Node>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function flowChartDrawer(flowChart) {
        flowChart.parentNodes.forEach((node) => assignNodeDepthAndNesting(node));
        const [layerTracker, maxLayer] = layerAssignment(flowChart);
        populateGhostNodes(layerTracker, flowChart);
        balanceLayers(layerTracker);
        for (let i = 0; i < 10; i++) {
            let nodeWasSwapped = false;
            for (let j = 0; j <= maxLayer; j++) {
                if (!layerTracker[j])
                    continue;
                for (let k = 0; k < layerTracker[j].length; k++) {
                    const node = layerTracker[j][k];
                    const bestSwapIndex = findBestSwapIndex(layerTracker, node, k);
                    if (bestSwapIndex) {
                        swapNodes(layerTracker[j], k, bestSwapIndex);
                        nodeWasSwapped = true;
                    }
                }
            }
            if (!nodeWasSwapped)
                break;
        }
        const nodesByDegree = sortNodesByDegree(layerTracker);
        for (let i = 0; i < 10; i++) {
            const nodeWasSwapped = siftNodes(layerTracker, nodesByDegree);
            if (!nodeWasSwapped)
                break;
        }
        for (let i = 0; i < 2; i++) {
            let nodeWasSwapped = false;
            for (let j = 0; j <= maxLayer; j++) {
                for (let k = 0; k < layerTracker[j].length; k++) {
                    const node = layerTracker[j][k];
                    const bestNullSwapIndex = findBestNullSwap(layerTracker, node, k);
                    if (bestNullSwapIndex) {
                        swapNodes(layerTracker[j], k, bestNullSwapIndex);
                        nodeWasSwapped = true;
                    }
                }
            }
            if (!nodeWasSwapped)
                break;
        }
        const grid = [];
        for (let i = 0; i <= maxLayer; i++) {
            grid.push(layerTracker[i]);
        }
        return grid;
    }
    function assignNodeDepthAndNesting(node, len = 0, nest = 0) {
        const nodesToNest = [];
        const helper = (node, len = 0, nest = 0) => {
            node.depth = Math.max(node.depth, len);
            node.nesting = Math.max(node.nesting, nest);
            nodesToNest.push(node);
            for (const childConnection of node.children) {
                const { node, length } = childConnection;
                helper(node, length + len, nest + 1);
            }
        };
        helper(node, len, nest);
        for (const node of nodesToNest) {
            if (node.children.length) {
                node.nesting = node.children[0].node.nesting - 1;
                node.depth = node.children[0].node.depth - node.children[0].length;
                for (const child of node.children) {
                    node.nesting = Math.min(node.nesting, child.node.nesting - 1);
                    node.depth = Math.min(node.depth, child.node.depth - child.length);
                }
            }
        }
    }
    function layerAssignment(flowChart) {
        let maxLayer = 0;
        const layerTracker = {};
        for (const nodeId in flowChart.nodeList) {
            const { depth, parents, children, type, data } = flowChart.nodeList[nodeId];
            maxLayer = Math.max(maxLayer, depth);
            if (!layerTracker[depth])
                layerTracker[depth] = [];
            const newNode = {
                id: nodeId,
                children: [],
                parents: [],
                layer: depth,
                type: type.trim()
            };
            if (data.props)
                newNode.propsId = data.props.trim();
            for (const parent of parents)
                newNode.parents.push(parent.node.id);
            for (const child of children)
                newNode.children.push(child.node.id);
            layerTracker[depth].push(newNode);
        }
        return [layerTracker, maxLayer];
    }
    function populateGhostNodes(layerTracker, flowChart) {
        for (const nodeId in flowChart.nodeList) {
            for (const child of flowChart.nodeList[nodeId].children) {
                if (child.node.depth - 1 > flowChart.nodeList[nodeId].depth) {
                    const startLayer = flowChart.nodeList[nodeId].depth + 1;
                    const endLayer = child.node.depth - 1;
                    const ghostNodeCollection = [];
                    let ghostNodeIncrement = 0;
                    for (let i = startLayer; i <= endLayer; i++) {
                        const ghostNode = {
                            id: `GHOST_${child.node.id}_${ghostNodeIncrement}`,
                            children: [],
                            parents: [],
                            layer: i,
                            ignore: true
                        };
                        ghostNodeCollection.push(ghostNode);
                        ghostNodeIncrement++;
                    }
                    for (const parent of child.node.parents)
                        ghostNodeCollection[0].parents.push(parent.node.id);
                    ghostNodeCollection[ghostNodeCollection.length - 1].children.push(child.node.id);
                    for (let i = 0; i < ghostNodeCollection.length - 1; i++)
                        ghostNodeCollection[i].children.push(`GHOST_${child.node.id}_${i + 1}`);
                    for (let i = endLayer; i >= startLayer; i--)
                        if (ghostNodeCollection.length > 0) {
                            layerTracker[i].push(ghostNodeCollection[0]);
                        }
                    for (const node of layerTracker[flowChart.nodeList[nodeId].depth]) {
                        if (node.id === nodeId) {
                            node.children.push(ghostNodeCollection[0].id);
                            node.children = node.children.filter((childId) => childId !== child.node.id);
                        }
                    }
                }
            }
        }
    }
    function balanceLayers(layerTracker) {
        let longestLayer = 0;
        for (const layer in layerTracker)
            longestLayer = Math.max(layerTracker[layer].length, longestLayer);
        for (const layer in layerTracker) {
            if (layerTracker[layer].length < longestLayer) {
                const balanceArray = Array.from({ length: longestLayer - layerTracker[layer].length }, () => {
                    return {
                        id: 'NULL_NODE',
                        children: [],
                        parents: [],
                        layer: parseInt(layer),
                        ignore: true
                    };
                });
                layerTracker[layer] = layerTracker[layer].concat(balanceArray);
            }
        }
    }
    function getAdjacencyMatrix(layerTracker, node, index) {
        let adjacencySum = 0;
        let nodeCount = 0;
        for (const parentId of node.parents) {
            for (let i = 0; i < layerTracker[node.layer - 1].length; i++) {
                if (parentId === layerTracker[node.layer - 1][i].id) {
                    adjacencySum += Math.abs(index - i);
                    break;
                }
            }
            nodeCount++;
        }
        for (const childId of node.children) {
            for (let i = 0; i < layerTracker[node.layer + 1].length; i++) {
                if (childId === layerTracker[node.layer + 1][i].id) {
                    adjacencySum += Math.abs(index - i);
                    break;
                }
            }
            nodeCount++;
        }
        if (isNaN(adjacencySum / nodeCount))
            return 0;
        return adjacencySum / nodeCount;
    }
    function getAdjacencyWithParents(layerTracker, node, index) {
        let adjacencySum = 0;
        let nodeCount = 0;
        for (const parentId of node.parents) {
            for (let i = 0; i < layerTracker[node.layer - 1].length; i++) {
                if (parentId === layerTracker[node.layer - 1][i].id) {
                    adjacencySum += Math.abs(index - i);
                    break;
                }
            }
            nodeCount++;
        }
        if (isNaN(adjacencySum / nodeCount))
            return 0;
        return adjacencySum / nodeCount;
    }
    function getAdjacencyWithChildren(layerTracker, node, index) {
        let adjacencySum = 0;
        let nodeCount = 0;
        for (const childId of node.children) {
            for (let i = 0; i < layerTracker[node.layer + 1].length; i++) {
                if (childId === layerTracker[node.layer + 1][i].id) {
                    adjacencySum += Math.abs(index - i);
                    break;
                }
            }
            nodeCount++;
        }
        if (isNaN(adjacencySum / nodeCount))
            return 0;
        return adjacencySum / nodeCount;
    }
    function findBestNullSwap(layerTracker, node, initialIndex) {
        const initialCrossings = countCrossings(layerTracker, node.layer);
        let initialAdjacency = 0;
        if (node.layer === 0)
            initialAdjacency = getAdjacencyWithChildren(layerTracker, node, initialIndex);
        else
            initialAdjacency = getAdjacencyWithParents(layerTracker, node, initialIndex);
        let minimumAdjacency = initialAdjacency;
        let indexToSwap = initialIndex;
        for (let i = 0; i < layerTracker[node.layer].length; i++) {
            const currentNode = layerTracker[node.layer][i];
            if (currentNode.id === 'NULL_NODE') {
                swapNodes(layerTracker[node.layer], initialIndex, i);
                const crossings = countCrossings(layerTracker, node.layer);
                let adjacency = 0;
                if (node.layer === 0)
                    adjacency = getAdjacencyWithChildren(layerTracker, node, i);
                else
                    adjacency = getAdjacencyWithParents(layerTracker, node, i);
                if (crossings <= initialCrossings && adjacency < minimumAdjacency) {
                    minimumAdjacency = adjacency;
                    indexToSwap = i;
                }
                swapNodes(layerTracker[node.layer], i, initialIndex);
            }
        }
        if (indexToSwap === initialIndex)
            return null;
        return indexToSwap;
    }
    function findBestSwapIndex(layerTracker, node, initialIndex) {
        const adjacencyMatrixTracker = {};
        let minMatrix = Infinity;
        let minMatrixIndex = 0;
        for (let i = 0; i < layerTracker[node.layer].length; i++) {
            const originalNodeMatrix = getAdjacencyMatrix(layerTracker, node, i);
            const swappableNodeMatrix = getAdjacencyMatrix(layerTracker, layerTracker[node.layer][i], initialIndex);
            adjacencyMatrixTracker[i] = originalNodeMatrix + swappableNodeMatrix;
        }
        for (const index in adjacencyMatrixTracker) {
            if (adjacencyMatrixTracker[index] < minMatrix) {
                minMatrix = adjacencyMatrixTracker[index];
                minMatrixIndex = parseInt(index);
            }
        }
        if (minMatrixIndex === initialIndex)
            return null;
        return minMatrixIndex;
    }
    function swapNodes(layer, nodeIndex, swapIndex) {
        const tempNode = layer[nodeIndex];
        layer[nodeIndex] = layer[swapIndex];
        layer[swapIndex] = tempNode;
    }
    function sortNodesByDegree(layerTracker) {
        const nodes = [];
        for (const layer in layerTracker) {
            for (const node of layerTracker[layer]) {
                nodes.push(node);
            }
        }
        return nodes.sort((node1, node2) => node2.parents.length + node2.children.length - (node1.parents.length + node1.children.length));
    }
    function countCrossings(layerTracker, layer) {
        let crossings = 0;
        for (let i = 0; i < layerTracker[layer].length; i++) {
            const currentNode = layerTracker[layer][i];
            const parentsAheadIndices = [];
            const childrenAheadIndices = [];
            if (layerTracker[layer - 1]) {
                for (let j = i + 1; j < layerTracker[layer - 1].length; j++) {
                    if (currentNode.parents.includes(layerTracker[layer - 1][j].id))
                        parentsAheadIndices.push(j);
                }
            }
            if (layerTracker[layer + 1]) {
                for (let j = i + 1; j < layerTracker[layer + 1].length; j++) {
                    if (currentNode.children.includes(layerTracker[layer + 1][j].id))
                        childrenAheadIndices.push(j);
                }
            }
            for (let j = i + 1; j < layerTracker[layer].length; j++) {
                const siblingNode = layerTracker[layer][j];
                if (parentsAheadIndices.length) {
                    for (let k = 0; k < layerTracker[layer - 1].length; k++) {
                        if (siblingNode.parents.includes(layerTracker[layer - 1][k].id)) {
                            parentsAheadIndices.forEach((index) => {
                                if (k < index)
                                    crossings++;
                            });
                        }
                    }
                }
                if (childrenAheadIndices.length) {
                    for (let k = 0; k < layerTracker[layer + 1].length; k++) {
                        if (siblingNode.children.includes(layerTracker[layer + 1][k].id)) {
                            childrenAheadIndices.forEach((index) => {
                                if (k < index)
                                    crossings++;
                            });
                        }
                    }
                }
            }
        }
        return crossings;
    }
    function siftNodes(layerTracker, sortedNodes) {
        let nodeWasSwapped = false;
        for (const node of sortedNodes) {
            if (node.children.length + node.parents.length === 0)
                return nodeWasSwapped;
            let nodeIndex = 0;
            for (let i = 0; i < layerTracker[node.layer].length; i++) {
                if (layerTracker[node.layer][i].id === node.id) {
                    nodeIndex = i;
                    break;
                }
            }
            let minCrossings = Infinity;
            let minCrossingsIndex = nodeIndex;
            for (let i = 0; i < layerTracker[node.layer].length; i++) {
                swapNodes(layerTracker[node.layer], nodeIndex, i);
                const crossings = countCrossings(layerTracker, node.layer);
                if (crossings < minCrossings) {
                    minCrossings = crossings;
                    minCrossingsIndex = i;
                }
                swapNodes(layerTracker[node.layer], i, nodeIndex);
            }
            if (minCrossingsIndex !== nodeIndex) {
                swapNodes(layerTracker[node.layer], nodeIndex, minCrossingsIndex);
                nodeWasSwapped = true;
            }
        }
        return nodeWasSwapped;
    }
    // function rotateGrid(grid: Array<Array<LayerNode>>, n: number) {
    // 	if (n === 0) return;
    // 	while (n > 0) {
    // 		for (let i = 0; i < grid.length; i++) grid[i].reverse();
    // 		for (let i = 0; i < grid.length; i++) {
    // 			for (let j = i; j < grid.length; j++) {
    // 				const temp = grid[i][j];
    // 				grid[i][j] = grid[j][i];
    // 				grid[j][i] = temp;
    // 			}
    // 		}
    // 		n--;
    // 	}
    // }
    // function makeGridSquare(grid: Array<Array<LayerNode>>) {
    // 	let largestSubArray = 0;
    // 	for (const array of grid) {
    // 		largestSubArray = Math.max(largestSubArray, array.length);
    // 	}
    // 	while (grid.length < largestSubArray)
    // 		grid.push(
    // 			Array.from({ length: largestSubArray }, () => {
    // 				return { id: 'NULL_NODE', children: [], parents: [], layer: grid.length };
    // 			})
    // 		);
    // 	for (const [i, array] of grid.entries()) {
    // 		if (array.length < largestSubArray) {
    // 			while (array.length < largestSubArray)
    // 				array.push({ id: 'NULL_NODE', children: [], parents: [], layer: i });
    // 		}
    // 	}
    // }

    /* node_modules/svelvet/dist/components/FlowChart/FlowChart.svelte generated by Svelte v3.58.0 */

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (38:2) {#if !node.ignore}
    function create_if_block$8(ctx) {
    	let node;
    	let current;

    	const node_spread_levels = [
    		{ label: /*node*/ ctx[9].id },
    		{ id: /*node*/ ctx[9].id },
    		{ TD: true },
    		/*mermaidConfig*/ ctx[0][/*node*/ ctx[9].id],
    		{
    			connections: /*node*/ ctx[9].children.map(func)
    		}
    	];

    	let node_props = {};

    	for (let i = 0; i < node_spread_levels.length; i += 1) {
    		node_props = assign(node_props, node_spread_levels[i]);
    	}

    	node = new Node({ props: node_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(node.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const node_changes = (dirty & /*grid, mermaidConfig*/ 3)
    			? get_spread_update(node_spread_levels, [
    					dirty & /*grid*/ 2 && { label: /*node*/ ctx[9].id },
    					dirty & /*grid*/ 2 && { id: /*node*/ ctx[9].id },
    					node_spread_levels[2],
    					get_spread_object(/*mermaidConfig*/ ctx[0][/*node*/ ctx[9].id]),
    					dirty & /*grid*/ 2 && {
    						connections: /*node*/ ctx[9].children.map(func)
    					}
    				])
    			: {};

    			node.$set(node_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(38:2) {#if !node.ignore}",
    		ctx
    	});

    	return block;
    }

    // (37:1) {#each row as node}
    function create_each_block_1$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*node*/ ctx[9].ignore && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*node*/ ctx[9].ignore) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(37:1) {#each row as node}",
    		ctx
    	});

    	return block;
    }

    // (36:0) {#each grid as row}
    function create_each_block$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*row*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid, mermaidConfig*/ 3) {
    				each_value_1 = /*row*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(36:0) {#each grid as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*grid*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid, mermaidConfig*/ 3) {
    				each_value = /*grid*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const MIN_X_SPACE = 100;
    const MIN_Y_SPACE = 100;
    const func = id => [id, '0'];

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FlowChart', slots, []);
    	let { mermaid = "" } = $$props;
    	let { mermaidConfig = {} } = $$props;
    	const flowChart = flowChartParser(mermaid);
    	const grid = flowChartDrawer(flowChart);
    	const graph = getContext("graph");
    	let nodeList;

    	onMount(() => {
    		graph.nodes.subscribe(nodes => nodeList = nodes);
    		let y = 0;

    		for (const row of grid) {
    			let x = 0;
    			let maxHeight = -Infinity;

    			for (const node of row) {
    				if (!node.ignore) {
    					nodeList[`N-${node.id}`].position.update(() => {
    						return { x, y };
    					});

    					nodeList[`N-${node.id}`].dimensions.width.subscribe(width => x += width);
    					nodeList[`N-${node.id}`].dimensions.height.subscribe(height => maxHeight = Math.max(maxHeight, height));
    				}

    				x += MIN_X_SPACE;
    			}

    			y += maxHeight + MIN_Y_SPACE;
    		}
    	});

    	const writable_props = ['mermaid', 'mermaidConfig'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FlowChart> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('mermaid' in $$props) $$invalidate(2, mermaid = $$props.mermaid);
    		if ('mermaidConfig' in $$props) $$invalidate(0, mermaidConfig = $$props.mermaidConfig);
    	};

    	$$self.$capture_state = () => ({
    		Node,
    		onMount,
    		getContext,
    		flowChartDrawer,
    		flowChartParser,
    		mermaid,
    		mermaidConfig,
    		flowChart,
    		grid,
    		graph,
    		MIN_X_SPACE,
    		MIN_Y_SPACE,
    		nodeList
    	});

    	$$self.$inject_state = $$props => {
    		if ('mermaid' in $$props) $$invalidate(2, mermaid = $$props.mermaid);
    		if ('mermaidConfig' in $$props) $$invalidate(0, mermaidConfig = $$props.mermaidConfig);
    		if ('nodeList' in $$props) nodeList = $$props.nodeList;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mermaidConfig, grid, mermaid];
    }

    class FlowChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { mermaid: 2, mermaidConfig: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FlowChart",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get mermaid() {
    		throw new Error("<FlowChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mermaid(value) {
    		throw new Error("<FlowChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mermaidConfig() {
    		throw new Error("<FlowChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mermaidConfig(value) {
    		throw new Error("<FlowChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const arrowTuple = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const arrows = new Set(arrowTuple);
    const isArrow = (key) => arrows.has(key);

    /* node_modules/svelvet/dist/components/data/Slider/Slider.svelte generated by Svelte v3.58.0 */
    const file$g = "node_modules/svelvet/dist/components/data/Slider/Slider.svelte";

    // (166:0) {:else}
    function create_else_block$3(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(/*label*/ ctx[2]);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*$parameterStore*/ ctx[6]);
    			attr_dev(p0, "class", "svelte-1okgqig");
    			add_location(p0, file$g, 168, 3, 4920);
    			attr_dev(p1, "class", "svelte-1okgqig");
    			add_location(p1, file$g, 169, 3, 4938);
    			attr_dev(div0, "class", "slider-input connected svelte-1okgqig");
    			attr_dev(div0, "aria-label", /*label*/ ctx[2]);
    			set_style(div0, "--percentage", `100%`);
    			add_location(div0, file$g, 167, 2, 4835);
    			attr_dev(div1, "class", "wrapper connected svelte-1okgqig");
    			add_location(div1, file$g, 166, 1, 4801);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*label*/ 4) set_data_dev(t0, /*label*/ ctx[2]);
    			if (dirty[0] & /*$parameterStore*/ 64) set_data_dev(t2, /*$parameterStore*/ ctx[6]);

    			if (dirty[0] & /*label*/ 4) {
    				attr_dev(div0, "aria-label", /*label*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(166:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (125:0) {#if !connected}
    function create_if_block$7(ctx) {
    	let div1;
    	let button0;
    	let t1;
    	let div0;
    	let label_1;
    	let t2;
    	let t3;
    	let input;
    	let input_value_value;
    	let div0_resize_listener;
    	let t4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "−";
    			t1 = space();
    			div0 = element("div");
    			label_1 = element("label");
    			t2 = text(/*label*/ ctx[2]);
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			attr_dev(button0, "class", "button svelte-1okgqig");
    			add_location(button0, file$g, 126, 2, 3678);
    			attr_dev(label_1, "for", "slider-input");
    			attr_dev(label_1, "class", "input-label svelte-1okgqig");
    			add_location(label_1, file$g, 132, 3, 3888);
    			attr_dev(input, "tabindex", 0);
    			attr_dev(input, "id", "slider-input");
    			attr_dev(input, "class", "slider-input svelte-1okgqig");
    			attr_dev(input, "type", "text");
    			input.value = input_value_value = /*$parameterStore*/ ctx[6].toFixed(/*fixed*/ ctx[3]);
    			attr_dev(input, "aria-label", /*label*/ ctx[2]);
    			set_style(input, "background", /*sliderStyle*/ ctx[9]);
    			set_style(input, "--percentage", /*CSSpercentage*/ ctx[5]);
    			add_location(input, file$g, 133, 3, 3953);
    			attr_dev(div0, "class", "slider svelte-1okgqig");
    			add_render_callback(() => /*div0_elementresize_handler*/ ctx[31].call(div0));
    			add_location(div0, file$g, 131, 2, 3833);
    			attr_dev(button1, "class", "button svelte-1okgqig");
    			add_location(button1, file$g, 159, 2, 4633);
    			attr_dev(div1, "class", "wrapper svelte-1okgqig");
    			set_style(div1, "color", /*fontColor*/ ctx[4]);
    			add_location(div1, file$g, 125, 1, 3630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, label_1);
    			append_dev(label_1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			/*input_binding*/ ctx[30](input);
    			div0_resize_listener = add_resize_listener(div0, /*div0_elementresize_handler*/ ctx[31].bind(div0));
    			append_dev(div1, t4);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "touchstart", stop_propagation(/*touchstart_handler*/ ctx[26]), { passive: true }, false, true, false),
    					listen_dev(button0, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[27]), false, false, true, false),
    					listen_dev(input, "wheel", stop_propagation(prevent_default(/*wheel_handler*/ ctx[28])), false, true, true, false),
    					listen_dev(input, "keydown", stop_propagation(/*keydown_handler*/ ctx[29]), false, false, true, false),
    					action_destroyer(/*slideable*/ ctx[15].call(null, input)),
    					listen_dev(button1, "touchstart", stop_propagation(/*touchstart_handler_1*/ ctx[32]), { passive: true }, false, true, false),
    					listen_dev(button1, "mousedown", stop_propagation(/*mousedown_handler_1*/ ctx[33]), false, false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*label*/ 4) set_data_dev(t2, /*label*/ ctx[2]);

    			if (dirty[0] & /*$parameterStore, fixed*/ 72 && input_value_value !== (input_value_value = /*$parameterStore*/ ctx[6].toFixed(/*fixed*/ ctx[3])) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*label*/ 4) {
    				attr_dev(input, "aria-label", /*label*/ ctx[2]);
    			}

    			if (dirty[0] & /*sliderStyle*/ 512) {
    				set_style(input, "background", /*sliderStyle*/ ctx[9]);
    			}

    			if (dirty[0] & /*CSSpercentage*/ 32) {
    				set_style(input, "--percentage", /*CSSpercentage*/ ctx[5]);
    			}

    			if (dirty[0] & /*fontColor*/ 16) {
    				set_style(div1, "color", /*fontColor*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_binding*/ ctx[30](null);
    			div0_resize_listener();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(125:0) {#if !connected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*connected*/ ctx[12]) return create_if_block$7;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let connected;
    	let width;
    	let cursor;
    	let percentageSlid;
    	let CSSpercentage;
    	let sliderStyle;

    	let $parameterStore,
    		$$unsubscribe_parameterStore = noop,
    		$$subscribe_parameterStore = () => ($$unsubscribe_parameterStore(), $$unsubscribe_parameterStore = subscribe(parameterStore, $$value => $$invalidate(6, $parameterStore = $$value)), parameterStore);

    	let $width,
    		$$unsubscribe_width = noop,
    		$$subscribe_width = () => ($$unsubscribe_width(), $$unsubscribe_width = subscribe(width, $$value => $$invalidate(36, $width = $$value)), width);

    	let $cursor,
    		$$unsubscribe_cursor = noop,
    		$$subscribe_cursor = () => ($$unsubscribe_cursor(), $$unsubscribe_cursor = subscribe(cursor, $$value => $$invalidate(25, $cursor = $$value)), cursor);

    	let $initialClickPosition;
    	let $activeGroup;
    	let $groups;
    	validate_store(initialClickPosition, 'initialClickPosition');
    	component_subscribe($$self, initialClickPosition, $$value => $$invalidate(37, $initialClickPosition = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_parameterStore());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_width());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_cursor());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Slider', slots, []);
    	let { parameterStore } = $$props;
    	validate_store(parameterStore, 'parameterStore');
    	$$subscribe_parameterStore();
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 1 } = $$props;
    	let { label = "Value" } = $$props;
    	let { fixed = 2 } = $$props;
    	let { fontColor = null } = $$props;
    	let { barColor = null } = $$props;
    	let { bgColor = null } = $$props;
    	let graph = getContext("graph");
    	let node = getContext("node");
    	const groups = graph.groups;
    	validate_store(groups, 'groups');
    	component_subscribe($$self, groups, value => $$invalidate(39, $groups = value));
    	const selected = $groups.selected;
    	const activeGroup = graph.activeGroup;
    	validate_store(activeGroup, 'activeGroup');
    	component_subscribe($$self, activeGroup, value => $$invalidate(38, $activeGroup = value));
    	let sliderWidth;
    	let sliderElement;
    	let sliding = false;
    	let previousX = 0;
    	let pixelsMoved = 0;

    	function startSlide(e) {
    		e.stopPropagation();
    		e.preventDefault();
    		set_store_value(initialClickPosition, $initialClickPosition = { x: $cursor.x, y: $cursor.y }, $initialClickPosition);
    		$$invalidate(23, previousX = $cursor.x);
    		window.addEventListener("mouseup", stopSlide, { once: true });
    		$$invalidate(22, sliding = true);
    	}

    	let previousValue = $parameterStore;

    	function startTouchSlide(e) {
    		set_store_value(activeGroup, $activeGroup = null, $activeGroup);
    		selected.nodes.set(/* @__PURE__ */ new Set());
    		tracking.set(false);
    		e.stopPropagation();
    		e.preventDefault();
    		set_store_value(initialClickPosition, $initialClickPosition = { x: $cursor.x, y: $cursor.y }, $initialClickPosition);
    		$$invalidate(23, previousX = $cursor.x);
    		window.addEventListener("touchend", stopSlide, { once: true });
    		$$invalidate(22, sliding = true);
    	}

    	function stopSlide() {
    		if (previousValue === $parameterStore) {
    			sliderElement.focus();
    			sliderElement.select();
    		} else {
    			previousValue = $parameterStore;
    		}

    		$$invalidate(22, sliding = false);
    		window.removeEventListener("mouseup", stopSlide);
    	}

    	function slideable(node2) {
    		node2.addEventListener("mousedown", startSlide);
    		node2.addEventListener("touchstart", startTouchSlide);

    		return {
    			destroy() {
    				node2.removeEventListener("mousedown", startSlide);
    			}
    		};
    	}

    	function updateValue(delta, increment = step) {
    		if (typeof $parameterStore !== "number") return;
    		set_store_value(parameterStore, $parameterStore = roundNum(Math.max(min, Math.min($parameterStore + delta * increment, max)), 3), $parameterStore);
    	}

    	function calculateSlide(cursorChange, increment = step) {
    		if (typeof $parameterStore !== "number") return;
    		const pixelsToMove = $width * 0.7 / ((max - min) / increment);
    		pixelsMoved += cursorChange;

    		if (Math.abs(pixelsMoved) >= pixelsToMove) {
    			const incrementsToMove = Math.floor(Math.abs(pixelsMoved) / pixelsToMove);

    			if (pixelsMoved > 0) {
    				updateValue(incrementsToMove);
    			} else {
    				updateValue(-incrementsToMove);
    			}

    			pixelsMoved = pixelsMoved > 0
    			? pixelsMoved - incrementsToMove * pixelsToMove
    			: pixelsMoved + incrementsToMove * pixelsToMove;
    		}
    	}

    	function validateInput() {
    		const number = parseFloat(sliderElement.value);

    		if (!Number.isNaN(number)) {
    			if (number <= min) {
    				set_store_value(parameterStore, $parameterStore = min, $parameterStore);
    			} else if (number >= max) {
    				set_store_value(parameterStore, $parameterStore = max, $parameterStore);
    			} else {
    				set_store_value(parameterStore, $parameterStore = roundNum(number, 2), $parameterStore);
    			}
    		}

    		$$invalidate(8, sliderElement.value = JSON.stringify($parameterStore), sliderElement);
    		sliderElement.blur();
    	}

    	$$self.$$.on_mount.push(function () {
    		if (parameterStore === undefined && !('parameterStore' in $$props || $$self.$$.bound[$$self.$$.props['parameterStore']])) {
    			console.warn("<Slider> was created without expected prop 'parameterStore'");
    		}
    	});

    	const writable_props = [
    		'parameterStore',
    		'min',
    		'max',
    		'step',
    		'label',
    		'fixed',
    		'fontColor',
    		'barColor',
    		'bgColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	const touchstart_handler = () => updateValue(-1);
    	const mousedown_handler = () => updateValue(-1);

    	const wheel_handler = event => {
    		updateValue(Math.sign(event.deltaY), step);
    	};

    	const keydown_handler = e => {
    		const { key } = e;

    		if (isArrow(key)) {
    			e.preventDefault(); // Stops cursor from moving
    			updateValue(key == 'ArrowDown' ? -1 : key == 'ArrowUp' ? 1 : 0);
    		}

    		if (key === 'Enter') validateInput();
    	};

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			sliderElement = $$value;
    			$$invalidate(8, sliderElement);
    		});
    	}

    	function div0_elementresize_handler() {
    		sliderWidth = this.offsetWidth;
    		$$invalidate(7, sliderWidth);
    	}

    	const touchstart_handler_1 = () => updateValue(1);
    	const mousedown_handler_1 = () => updateValue(1);

    	$$self.$$set = $$props => {
    		if ('parameterStore' in $$props) $$subscribe_parameterStore($$invalidate(0, parameterStore = $$props.parameterStore));
    		if ('min' in $$props) $$invalidate(18, min = $$props.min);
    		if ('max' in $$props) $$invalidate(19, max = $$props.max);
    		if ('step' in $$props) $$invalidate(1, step = $$props.step);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('fixed' in $$props) $$invalidate(3, fixed = $$props.fixed);
    		if ('fontColor' in $$props) $$invalidate(4, fontColor = $$props.fontColor);
    		if ('barColor' in $$props) $$invalidate(20, barColor = $$props.barColor);
    		if ('bgColor' in $$props) $$invalidate(21, bgColor = $$props.bgColor);
    	};

    	$$self.$capture_state = () => ({
    		initialClickPosition,
    		getContext,
    		isArrow,
    		roundNum,
    		tracking,
    		parameterStore,
    		min,
    		max,
    		step,
    		label,
    		fixed,
    		fontColor,
    		barColor,
    		bgColor,
    		graph,
    		node,
    		groups,
    		selected,
    		activeGroup,
    		sliderWidth,
    		sliderElement,
    		sliding,
    		previousX,
    		pixelsMoved,
    		startSlide,
    		previousValue,
    		startTouchSlide,
    		stopSlide,
    		slideable,
    		updateValue,
    		calculateSlide,
    		validateInput,
    		CSSpercentage,
    		sliderStyle,
    		percentageSlid,
    		cursor,
    		width,
    		connected,
    		$parameterStore,
    		$width,
    		$cursor,
    		$initialClickPosition,
    		$activeGroup,
    		$groups
    	});

    	$$self.$inject_state = $$props => {
    		if ('parameterStore' in $$props) $$subscribe_parameterStore($$invalidate(0, parameterStore = $$props.parameterStore));
    		if ('min' in $$props) $$invalidate(18, min = $$props.min);
    		if ('max' in $$props) $$invalidate(19, max = $$props.max);
    		if ('step' in $$props) $$invalidate(1, step = $$props.step);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('fixed' in $$props) $$invalidate(3, fixed = $$props.fixed);
    		if ('fontColor' in $$props) $$invalidate(4, fontColor = $$props.fontColor);
    		if ('barColor' in $$props) $$invalidate(20, barColor = $$props.barColor);
    		if ('bgColor' in $$props) $$invalidate(21, bgColor = $$props.bgColor);
    		if ('graph' in $$props) $$invalidate(40, graph = $$props.graph);
    		if ('node' in $$props) $$invalidate(41, node = $$props.node);
    		if ('sliderWidth' in $$props) $$invalidate(7, sliderWidth = $$props.sliderWidth);
    		if ('sliderElement' in $$props) $$invalidate(8, sliderElement = $$props.sliderElement);
    		if ('sliding' in $$props) $$invalidate(22, sliding = $$props.sliding);
    		if ('previousX' in $$props) $$invalidate(23, previousX = $$props.previousX);
    		if ('pixelsMoved' in $$props) pixelsMoved = $$props.pixelsMoved;
    		if ('previousValue' in $$props) previousValue = $$props.previousValue;
    		if ('CSSpercentage' in $$props) $$invalidate(5, CSSpercentage = $$props.CSSpercentage);
    		if ('sliderStyle' in $$props) $$invalidate(9, sliderStyle = $$props.sliderStyle);
    		if ('percentageSlid' in $$props) $$invalidate(24, percentageSlid = $$props.percentageSlid);
    		if ('cursor' in $$props) $$subscribe_cursor($$invalidate(10, cursor = $$props.cursor));
    		if ('width' in $$props) $$subscribe_width($$invalidate(11, width = $$props.width));
    		if ('connected' in $$props) $$invalidate(12, connected = $$props.connected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*parameterStore*/ 1) {
    			$$invalidate(12, connected = typeof parameterStore.set !== "function");
    		}

    		if ($$self.$$.dirty[0] & /*sliding, $cursor, previousX*/ 46137344) {
    			if (sliding) {
    				const deltaX = $cursor.x - previousX;
    				calculateSlide(deltaX);
    				$$invalidate(23, previousX = $cursor.x);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$parameterStore, min, max*/ 786496) {
    			$$invalidate(24, percentageSlid = ($parameterStore - min) / (max - min) * 100);
    		}

    		if ($$self.$$.dirty[0] & /*percentageSlid*/ 16777216) {
    			$$invalidate(5, CSSpercentage = `${percentageSlid}%`);
    		}

    		if ($$self.$$.dirty[0] & /*barColor, CSSpercentage, bgColor*/ 3145760) {
    			$$invalidate(9, sliderStyle = `linear-gradient(
			90deg,
			${barColor || "var(--primary-color, var(--default-primary-color))"} ${CSSpercentage},
			${bgColor || "var(--accent-color, var(--default-accent-color))"} ${CSSpercentage}
		)`);
    		}
    	};

    	$$subscribe_width($$invalidate(11, width = node.dimensions.width));
    	$$subscribe_cursor($$invalidate(10, cursor = graph.cursor));

    	return [
    		parameterStore,
    		step,
    		label,
    		fixed,
    		fontColor,
    		CSSpercentage,
    		$parameterStore,
    		sliderWidth,
    		sliderElement,
    		sliderStyle,
    		cursor,
    		width,
    		connected,
    		groups,
    		activeGroup,
    		slideable,
    		updateValue,
    		validateInput,
    		min,
    		max,
    		barColor,
    		bgColor,
    		sliding,
    		previousX,
    		percentageSlid,
    		$cursor,
    		touchstart_handler,
    		mousedown_handler,
    		wheel_handler,
    		keydown_handler,
    		input_binding,
    		div0_elementresize_handler,
    		touchstart_handler_1,
    		mousedown_handler_1
    	];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$l,
    			create_fragment$l,
    			safe_not_equal,
    			{
    				parameterStore: 0,
    				min: 18,
    				max: 19,
    				step: 1,
    				label: 2,
    				fixed: 3,
    				fontColor: 4,
    				barColor: 20,
    				bgColor: 21
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get parameterStore() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parameterStore(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fixed() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fixed(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontColor() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontColor(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barColor() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barColor(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/data/TextField/TextField.svelte generated by Svelte v3.58.0 */
    const file$f = "node_modules/svelvet/dist/components/data/TextField/TextField.svelte";

    function create_fragment$k(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			attr_dev(input, "type", "text");
    			add_location(input, file$f, 5, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$textStore*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", stop_propagation(/*keydown_handler*/ ctx[3]), false, false, true, false),
    					listen_dev(input, "click", stop_propagation(/*click_handler*/ ctx[4]), false, false, true, false),
    					listen_dev(input, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[5]), false, false, true, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}

    			if (dirty & /*$textStore*/ 2 && input.value !== /*$textStore*/ ctx[1]) {
    				set_input_value(input, /*$textStore*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $textStore;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextField', slots, []);
    	let { placeholder } = $$props;
    	const textStore = getContext("textStore");
    	validate_store(textStore, 'textStore');
    	component_subscribe($$self, textStore, value => $$invalidate(1, $textStore = value));

    	$$self.$$.on_mount.push(function () {
    		if (placeholder === undefined && !('placeholder' in $$props || $$self.$$.bound[$$self.$$.props['placeholder']])) {
    			console.warn("<TextField> was created without expected prop 'placeholder'");
    		}
    	});

    	const writable_props = ['placeholder'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextField> was created with unknown prop '${key}'`);
    	});

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mousedown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_input_handler() {
    		$textStore = this.value;
    		textStore.set($textStore);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		placeholder,
    		textStore,
    		$textStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		placeholder,
    		$textStore,
    		textStore,
    		keydown_handler,
    		click_handler,
    		mousedown_handler,
    		input_input_handler
    	];
    }

    class TextField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { placeholder: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextField",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Editor/Editor.svelte generated by Svelte v3.58.0 */
    const file$e = "node_modules/svelvet/dist/components/Editor/Editor.svelte";

    // (18:0) <Node  let:grabHandle  zIndex={Infinity}  position={{ x: $cursor.x, y: $cursor.y }}  bgColor="white"  id="editor" >
    function create_default_slot$5(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let slider;
    	let t2;
    	let textfield;
    	let t3;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	slider = new Slider({
    			props: {
    				parameterStore: /*editing*/ ctx[0].dimensions.width,
    				max: 1000
    			},
    			$$inline: true
    		});

    	textfield = new TextField({
    			props: { placeholder: 'Node Label' },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "X";
    			t1 = space();
    			create_component(slider.$$.fragment);
    			t2 = space();
    			create_component(textfield.$$.fragment);
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Delete Node";
    			add_location(button0, file$e, 25, 2, 655);
    			add_location(button1, file$e, 28, 2, 826);
    			attr_dev(div, "class", "editor svelte-xh8yyu");
    			add_location(div, file$e, 24, 1, 617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			mount_component(slider, div, null);
    			append_dev(div, t2);
    			mount_component(textfield, div, null);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false, false),
    					listen_dev(button1, "click", /*deleteNode*/ ctx[4], false, false, false, false),
    					action_destroyer(/*grabHandle*/ ctx[6].call(null, div))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const slider_changes = {};
    			if (dirty & /*editing*/ 1) slider_changes.parameterStore = /*editing*/ ctx[0].dimensions.width;
    			slider.$set(slider_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider.$$.fragment, local);
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider.$$.fragment, local);
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(slider);
    			destroy_component(textfield);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(18:0) <Node  let:grabHandle  zIndex={Infinity}  position={{ x: $cursor.x, y: $cursor.y }}  bgColor=\\\"white\\\"  id=\\\"editor\\\" >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let node;
    	let current;

    	node = new Node({
    			props: {
    				zIndex: Infinity,
    				position: {
    					x: /*$cursor*/ ctx[2].x,
    					y: /*$cursor*/ ctx[2].y
    				},
    				bgColor: "white",
    				id: "editor",
    				$$slots: {
    					default: [
    						create_default_slot$5,
    						({ grabHandle }) => ({ 6: grabHandle }),
    						({ grabHandle }) => grabHandle ? 64 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(node, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const node_changes = {};

    			if (dirty & /*$cursor*/ 4) node_changes.position = {
    				x: /*$cursor*/ ctx[2].x,
    				y: /*$cursor*/ ctx[2].y
    			};

    			if (dirty & /*$$scope, editing*/ 129) {
    				node_changes.$$scope = { dirty, ctx };
    			}

    			node.$set(node_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let cursor;

    	let $cursor,
    		$$unsubscribe_cursor = noop,
    		$$subscribe_cursor = () => ($$unsubscribe_cursor(), $$unsubscribe_cursor = subscribe(cursor, $$value => $$invalidate(2, $cursor = $$value)), cursor);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_cursor());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Editor', slots, []);
    	let { editing } = $$props;
    	const graph = getContext("graph");
    	setContext("graph", graph);
    	setContext("textStore", editing.label);
    	setContext("colorStore", editing.bgColor);

    	function deleteNode() {
    		graph.nodes.delete(editing.id);
    		graph.editing.set(null);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (editing === undefined && !('editing' in $$props || $$self.$$.bound[$$self.$$.props['editing']])) {
    			console.warn("<Editor> was created without expected prop 'editing'");
    		}
    	});

    	const writable_props = ['editing'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => graph.editing.set(null);

    	$$self.$$set = $$props => {
    		if ('editing' in $$props) $$invalidate(0, editing = $$props.editing);
    	};

    	$$self.$capture_state = () => ({
    		Slider,
    		TextField,
    		getContext,
    		setContext,
    		Node,
    		editing,
    		graph,
    		deleteNode,
    		cursor,
    		$cursor
    	});

    	$$self.$inject_state = $$props => {
    		if ('editing' in $$props) $$invalidate(0, editing = $$props.editing);
    		if ('cursor' in $$props) $$subscribe_cursor($$invalidate(1, cursor = $$props.cursor));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$subscribe_cursor($$invalidate(1, cursor = graph.cursor));
    	return [editing, cursor, $cursor, graph, deleteNode, click_handler];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { editing: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get editing() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editing(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Group/GroupBoundingBox.svelte generated by Svelte v3.58.0 */
    const file$d = "node_modules/svelvet/dist/components/Group/GroupBoundingBox.svelte";

    function create_fragment$i(ctx) {
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "bounding-box svelte-1e5jg43");
    			set_style(div0, "background-color", /*$color*/ ctx[6]);
    			add_location(div0, file$d, 25, 1, 653);
    			attr_dev(div1, "class", "bounding-box-border svelte-1e5jg43");
    			attr_dev(div1, "id", /*id*/ ctx[2]);
    			set_style(div1, "border", "solid 4px " + /*$color*/ ctx[6]);
    			set_style(div1, "top", `${/*$position*/ ctx[3].y}px`);
    			set_style(div1, "left", `${/*$position*/ ctx[3].x}px`);
    			set_style(div1, "width", `${/*$width*/ ctx[4]}px`);
    			set_style(div1, "height", `${/*$height*/ ctx[5]}px`);
    			add_location(div1, file$d, 14, 0, 340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "contextmenu", stop_propagation(prevent_default(/*contextmenu_handler*/ ctx[12])), false, true, true, false),
    					listen_dev(div1, "mousedown", stop_propagation(prevent_default(/*dispatchClick*/ ctx[9])), false, true, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$color*/ 64) {
    				set_style(div0, "background-color", /*$color*/ ctx[6]);
    			}

    			if (dirty & /*id*/ 4) {
    				attr_dev(div1, "id", /*id*/ ctx[2]);
    			}

    			if (dirty & /*$color*/ 64) {
    				set_style(div1, "border", "solid 4px " + /*$color*/ ctx[6]);
    			}

    			const style_changed = dirty & /*$color*/ 64;

    			if (style_changed || dirty & /*$position, $color*/ 72) {
    				set_style(div1, "top", `${/*$position*/ ctx[3].y}px`);
    			}

    			if (style_changed || dirty & /*$position, $color*/ 72) {
    				set_style(div1, "left", `${/*$position*/ ctx[3].x}px`);
    			}

    			if (style_changed || dirty & /*$width, $color*/ 80) {
    				set_style(div1, "width", `${/*$width*/ ctx[4]}px`);
    			}

    			if (style_changed || dirty & /*$height, $color*/ 96) {
    				set_style(div1, "height", `${/*$height*/ ctx[5]}px`);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let id;

    	let $position,
    		$$unsubscribe_position = noop,
    		$$subscribe_position = () => ($$unsubscribe_position(), $$unsubscribe_position = subscribe(position, $$value => $$invalidate(3, $position = $$value)), position);

    	let $width;
    	let $height;

    	let $color,
    		$$unsubscribe_color = noop,
    		$$subscribe_color = () => ($$unsubscribe_color(), $$unsubscribe_color = subscribe(color, $$value => $$invalidate(6, $color = $$value)), color);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_position());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_color());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupBoundingBox', slots, []);
    	let { dimensions } = $$props;
    	let { position } = $$props;
    	validate_store(position, 'position');
    	$$subscribe_position();
    	let { color } = $$props;
    	validate_store(color, 'color');
    	$$subscribe_color();
    	let { groupName } = $$props;
    	const { width, height } = dimensions;
    	validate_store(width, 'width');
    	component_subscribe($$self, width, value => $$invalidate(4, $width = value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, value => $$invalidate(5, $height = value));
    	const dispatch = createEventDispatcher();

    	function dispatchClick() {
    		dispatch("groupClick", { groupName });
    	}

    	$$self.$$.on_mount.push(function () {
    		if (dimensions === undefined && !('dimensions' in $$props || $$self.$$.bound[$$self.$$.props['dimensions']])) {
    			console.warn("<GroupBoundingBox> was created without expected prop 'dimensions'");
    		}

    		if (position === undefined && !('position' in $$props || $$self.$$.bound[$$self.$$.props['position']])) {
    			console.warn("<GroupBoundingBox> was created without expected prop 'position'");
    		}

    		if (color === undefined && !('color' in $$props || $$self.$$.bound[$$self.$$.props['color']])) {
    			console.warn("<GroupBoundingBox> was created without expected prop 'color'");
    		}

    		if (groupName === undefined && !('groupName' in $$props || $$self.$$.bound[$$self.$$.props['groupName']])) {
    			console.warn("<GroupBoundingBox> was created without expected prop 'groupName'");
    		}
    	});

    	const writable_props = ['dimensions', 'position', 'color', 'groupName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupBoundingBox> was created with unknown prop '${key}'`);
    	});

    	function contextmenu_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('dimensions' in $$props) $$invalidate(10, dimensions = $$props.dimensions);
    		if ('position' in $$props) $$subscribe_position($$invalidate(0, position = $$props.position));
    		if ('color' in $$props) $$subscribe_color($$invalidate(1, color = $$props.color));
    		if ('groupName' in $$props) $$invalidate(11, groupName = $$props.groupName);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dimensions,
    		position,
    		color,
    		groupName,
    		width,
    		height,
    		dispatch,
    		dispatchClick,
    		id,
    		$position,
    		$width,
    		$height,
    		$color
    	});

    	$$self.$inject_state = $$props => {
    		if ('dimensions' in $$props) $$invalidate(10, dimensions = $$props.dimensions);
    		if ('position' in $$props) $$subscribe_position($$invalidate(0, position = $$props.position));
    		if ('color' in $$props) $$subscribe_color($$invalidate(1, color = $$props.color));
    		if ('groupName' in $$props) $$invalidate(11, groupName = $$props.groupName);
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*groupName*/ 2048) {
    			$$invalidate(2, id = `${groupName}-bounding-box`);
    		}
    	};

    	return [
    		position,
    		color,
    		id,
    		$position,
    		$width,
    		$height,
    		$color,
    		width,
    		height,
    		dispatchClick,
    		dimensions,
    		groupName,
    		contextmenu_handler
    	];
    }

    class GroupBoundingBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			dimensions: 10,
    			position: 0,
    			color: 1,
    			groupName: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupBoundingBox",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get dimensions() {
    		throw new Error("<GroupBoundingBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dimensions(value) {
    		throw new Error("<GroupBoundingBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<GroupBoundingBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<GroupBoundingBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<GroupBoundingBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<GroupBoundingBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupName() {
    		throw new Error("<GroupBoundingBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupName(value) {
    		throw new Error("<GroupBoundingBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/renderers/GroupBoxRenderer/GroupBoxRenderer.svelte generated by Svelte v3.58.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (7:0) {#each Array.from($groupBoxes) as [id, group] (id)}
    function create_each_block$2(key_1, ctx) {
    	let first;
    	let groupboundingbox;
    	let current;
    	const groupboundingbox_spread_levels = [/*group*/ ctx[5], { groupName: /*id*/ ctx[4] }];
    	let groupboundingbox_props = {};

    	for (let i = 0; i < groupboundingbox_spread_levels.length; i += 1) {
    		groupboundingbox_props = assign(groupboundingbox_props, groupboundingbox_spread_levels[i]);
    	}

    	groupboundingbox = new GroupBoundingBox({
    			props: groupboundingbox_props,
    			$$inline: true
    		});

    	groupboundingbox.$on("groupClick", /*groupClick_handler*/ ctx[2]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(groupboundingbox.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(groupboundingbox, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const groupboundingbox_changes = (dirty & /*Array, $groupBoxes*/ 1)
    			? get_spread_update(groupboundingbox_spread_levels, [get_spread_object(/*group*/ ctx[5]), { groupName: /*id*/ ctx[4] }])
    			: {};

    			groupboundingbox.$set(groupboundingbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(groupboundingbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(groupboundingbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(groupboundingbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(7:0) {#each Array.from($groupBoxes) as [id, group] (id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = Array.from(/*$groupBoxes*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*id*/ ctx[4];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array, $groupBoxes*/ 1) {
    				each_value = Array.from(/*$groupBoxes*/ ctx[0]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$2, each_1_anchor, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $groupBoxes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupBoxRenderer', slots, []);
    	const graph = getContext("graph");
    	const groupBoxes = graph.groupBoxes;
    	validate_store(groupBoxes, 'groupBoxes');
    	component_subscribe($$self, groupBoxes, value => $$invalidate(0, $groupBoxes = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupBoxRenderer> was created with unknown prop '${key}'`);
    	});

    	function groupClick_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$capture_state = () => ({
    		GroupBoundingBox,
    		getContext,
    		graph,
    		groupBoxes,
    		$groupBoxes
    	});

    	return [$groupBoxes, groupBoxes, groupClick_handler];
    }

    class GroupBoxRenderer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupBoxRenderer",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* node_modules/svelvet/dist/components/Edge/Edge.svelte generated by Svelte v3.58.0 */

    const file$c = "node_modules/svelvet/dist/components/Edge/Edge.svelte";
    const get_label_slot_changes = dirty => ({ path: dirty[0] & /*path*/ 256 });

    const get_label_slot_context = ctx => ({
    	path: /*path*/ ctx[8],
    	destroy: /*destroy*/ ctx[31]
    });

    const get_default_slot_changes$1 = dirty => ({ path: dirty[0] & /*path*/ 256 });

    const get_default_slot_context$1 = ctx => ({
    	path: /*path*/ ctx[8],
    	destroy: /*destroy*/ ctx[31]
    });

    // (264:24)    
    function fallback_block_1(ctx) {
    	let path_1;

    	const block = {
    		c: function create() {
    			path_1 = svg_element("path");
    			attr_dev(path_1, "id", /*edgeKey*/ ctx[30]);
    			attr_dev(path_1, "class", "edge svelte-1qvkqri");
    			attr_dev(path_1, "d", /*path*/ ctx[8]);
    			toggle_class(path_1, "animate", /*animate*/ ctx[0]);
    			set_style(path_1, "--prop-edge-color", /*finalColor*/ ctx[14]);
    			set_style(path_1, "--prop-stroke-width", /*width*/ ctx[2] ? /*width*/ ctx[2] + 'px' : null);
    			add_location(path_1, file$c, 264, 2, 8915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path_1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*path*/ 256) {
    				attr_dev(path_1, "d", /*path*/ ctx[8]);
    			}

    			if (dirty[0] & /*animate*/ 1) {
    				toggle_class(path_1, "animate", /*animate*/ ctx[0]);
    			}

    			if (dirty[0] & /*finalColor*/ 16384) {
    				set_style(path_1, "--prop-edge-color", /*finalColor*/ ctx[14]);
    			}

    			if (dirty[0] & /*width*/ 4) {
    				set_style(path_1, "--prop-stroke-width", /*width*/ ctx[2] ? /*width*/ ctx[2] + 'px' : null);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(264:24)    ",
    		ctx
    	});

    	return block;
    }

    // (275:1) {#if renderLabel}
    function create_if_block$6(ctx) {
    	let foreignObject;
    	let span;
    	let foreignObject_x_value;
    	let foreignObject_y_value;
    	let current;
    	const label_slot_template = /*#slots*/ ctx[83].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[82], get_label_slot_context);
    	const label_slot_or_fallback = label_slot || fallback_block$1(ctx);

    	const block = {
    		c: function create() {
    			foreignObject = svg_element("foreignObject");
    			span = element("span");
    			if (label_slot_or_fallback) label_slot_or_fallback.c();
    			attr_dev(span, "class", "label-wrapper svelte-1qvkqri");
    			add_location(span, file$c, 276, 3, 9201);
    			attr_dev(foreignObject, "x", foreignObject_x_value = /*pathMidPoint*/ ctx[10].x);
    			attr_dev(foreignObject, "y", foreignObject_y_value = /*pathMidPoint*/ ctx[10].y);
    			attr_dev(foreignObject, "width", "100%");
    			attr_dev(foreignObject, "height", "100%");
    			attr_dev(foreignObject, "class", "svelte-1qvkqri");
    			add_location(foreignObject, file$c, 275, 2, 9117);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, foreignObject, anchor);
    			append_dev(foreignObject, span);

    			if (label_slot_or_fallback) {
    				label_slot_or_fallback.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (label_slot) {
    				if (label_slot.p && (!current || dirty[0] & /*path*/ 256 | dirty[2] & /*$$scope*/ 1048576)) {
    					update_slot_base(
    						label_slot,
    						label_slot_template,
    						ctx,
    						/*$$scope*/ ctx[82],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[82])
    						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[82], dirty, get_label_slot_changes),
    						get_label_slot_context
    					);
    				}
    			} else {
    				if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty[0] & /*labelColor, textColor, labelText*/ 152)) {
    					label_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*pathMidPoint*/ 1024 && foreignObject_x_value !== (foreignObject_x_value = /*pathMidPoint*/ ctx[10].x)) {
    				attr_dev(foreignObject, "x", foreignObject_x_value);
    			}

    			if (!current || dirty[0] & /*pathMidPoint*/ 1024 && foreignObject_y_value !== (foreignObject_y_value = /*pathMidPoint*/ ctx[10].y)) {
    				attr_dev(foreignObject, "y", foreignObject_y_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(foreignObject);
    			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(275:1) {#if renderLabel}",
    		ctx
    	});

    	return block;
    }

    // (278:23)       
    function fallback_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*labelText*/ ctx[7]);
    			attr_dev(div, "class", "default-label svelte-1qvkqri");
    			set_style(div, "--prop-label-color", /*labelColor*/ ctx[3]);
    			set_style(div, "--prop-label-text-color", /*textColor*/ ctx[4]);
    			add_location(div, file$c, 278, 5, 9259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*labelText*/ 128) set_data_dev(t, /*labelText*/ ctx[7]);

    			if (dirty[0] & /*labelColor*/ 8) {
    				set_style(div, "--prop-label-color", /*labelColor*/ ctx[3]);
    			}

    			if (dirty[0] & /*textColor*/ 16) {
    				set_style(div, "--prop-label-text-color", /*textColor*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(278:23)       ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let svg;
    	let path_1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[83].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[82], get_default_slot_context$1);
    	const default_slot_or_fallback = default_slot || fallback_block_1(ctx);
    	let if_block = /*renderLabel*/ ctx[6] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			if (if_block) if_block.c();
    			attr_dev(path_1, "id", /*edgeKey*/ ctx[30] + '-target');
    			attr_dev(path_1, "class", "target svelte-1qvkqri");
    			attr_dev(path_1, "d", /*path*/ ctx[8]);
    			toggle_class(path_1, "cursor", /*edgeKey*/ ctx[30] === 'cursor' || !/*edgeClick*/ ctx[1]);
    			set_style(path_1, "cursor", /*edgeClick*/ ctx[1] ? 'pointer' : 'move');

    			set_style(path_1, "--prop-target-edge-color", /*edgeClick*/ ctx[1]
    			? /*targetColor*/ ctx[5] || null
    			: 'transparent');

    			add_location(path_1, file$c, 253, 1, 8591);
    			attr_dev(svg, "class", "edges-wrapper svelte-1qvkqri");
    			set_style(svg, "z-index", /*zIndex*/ ctx[11]);
    			add_location(svg, file$c, 252, 0, 8539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path_1);
    			/*path_1_binding*/ ctx[84](path_1);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svg, null);
    			}

    			if (if_block) if_block.m(svg, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					path_1,
    					"mousedown",
    					function () {
    						if (is_function(/*edgeClick*/ ctx[1])) /*edgeClick*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*path*/ 256) {
    				attr_dev(path_1, "d", /*path*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*edgeKey, edgeClick*/ 1073741826) {
    				toggle_class(path_1, "cursor", /*edgeKey*/ ctx[30] === 'cursor' || !/*edgeClick*/ ctx[1]);
    			}

    			if (dirty[0] & /*edgeClick*/ 2) {
    				set_style(path_1, "cursor", /*edgeClick*/ ctx[1] ? 'pointer' : 'move');
    			}

    			if (dirty[0] & /*edgeClick, targetColor*/ 34) {
    				set_style(path_1, "--prop-target-edge-color", /*edgeClick*/ ctx[1]
    				? /*targetColor*/ ctx[5] || null
    				: 'transparent');
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*path*/ 256 | dirty[2] & /*$$scope*/ 1048576)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[82],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[82])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[82], dirty, get_default_slot_changes$1),
    						get_default_slot_context$1
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*path, animate, finalColor, width*/ 16645)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
    				}
    			}

    			if (/*renderLabel*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*renderLabel*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(svg, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*zIndex*/ 2048) {
    				set_style(svg, "z-index", /*zIndex*/ ctx[11]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			/*path_1_binding*/ ctx[84](null);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let animationFrameId$1;

    function instance$g($$self, $$props, $$invalidate) {
    	let dynamic;
    	let edgeColor;
    	let edgeLabel;
    	let finalColor;
    	let labelText;
    	let renderLabel;
    	let sourcePosition;
    	let targetPosition;
    	let sourceNodePosition;
    	let targetNodePosition;
    	let sourceX;
    	let sourceY;
    	let targetX;
    	let targetY;
    	let deltaX;
    	let deltaY;
    	let anchorWidth;
    	let anchorHeight;
    	let maxCurveDisplaceX;
    	let maxCurveDisplaceY;
    	let sourceControlVector;
    	let targetControlVector;
    	let sourceControlX;
    	let sourceControlY;
    	let targetControlX;
    	let targetControlY;
    	let controlPointString;
    	let sourceZIndex;
    	let targetZIndex;
    	let maxZIndex;
    	let zIndex;

    	let $targetZIndex,
    		$$unsubscribe_targetZIndex = noop,
    		$$subscribe_targetZIndex = () => ($$unsubscribe_targetZIndex(), $$unsubscribe_targetZIndex = subscribe(targetZIndex, $$value => $$invalidate(65, $targetZIndex = $$value)), targetZIndex);

    	let $sourceZIndex,
    		$$unsubscribe_sourceZIndex = noop,
    		$$subscribe_sourceZIndex = () => ($$unsubscribe_sourceZIndex(), $$unsubscribe_sourceZIndex = subscribe(sourceZIndex, $$value => $$invalidate(66, $sourceZIndex = $$value)), sourceZIndex);

    	let $targetDirection;
    	let $sourceDirection;
    	let $edgeType;
    	let $targetDynamic;
    	let $sourceDynamic;
    	let $targetMoving;
    	let $sourceMoving;
    	let $targetRotation;
    	let $sourceRotation;
    	let $targetNodePositionStore;
    	let $sourceNodePositionStore;
    	let $targetPositionStore;
    	let $sourcePositionStore;

    	let $edgeLabel,
    		$$unsubscribe_edgeLabel = noop,
    		$$subscribe_edgeLabel = () => ($$unsubscribe_edgeLabel(), $$unsubscribe_edgeLabel = subscribe(edgeLabel, $$value => $$invalidate(80, $edgeLabel = $$value)), edgeLabel);

    	let $edgeColor,
    		$$unsubscribe_edgeColor = noop,
    		$$subscribe_edgeColor = () => ($$unsubscribe_edgeColor(), $$unsubscribe_edgeColor = subscribe(edgeColor, $$value => $$invalidate(81, $edgeColor = $$value)), edgeColor);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_targetZIndex());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_sourceZIndex());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_edgeLabel());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_edgeColor());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Edge', slots, ['default','label']);
    	const $$slots = compute_slots(slots);
    	const edgeStore = getContext("edgeStore");
    	const edgeStyle = getContext("edgeStyle");
    	const raiseEdgesOnSelect = getContext("raiseEdgesOnSelect");
    	const edgesAboveNode = getContext("edgesAboveNode");
    	let { edge = getContext("edge") } = $$props;
    	let { straight = edgeStyle === "straight" } = $$props;
    	let { step = edgeStyle === "step" } = $$props;
    	let { animate = false } = $$props;
    	let { label = "" } = $$props;
    	let { edgeClick = null } = $$props;
    	let { width = null } = $$props;
    	let { color = null } = $$props;
    	let { labelColor = null } = $$props;
    	let { textColor = null } = $$props;
    	let { cornerRadius = 8 } = $$props;
    	let { targetColor = null } = $$props;
    	const source = edge.source;
    	const target = edge.target;
    	const sourceDirection = source.direction;
    	validate_store(sourceDirection, 'sourceDirection');
    	component_subscribe($$self, sourceDirection, value => $$invalidate(68, $sourceDirection = value));
    	const targetDirection = target.direction;
    	validate_store(targetDirection, 'targetDirection');
    	component_subscribe($$self, targetDirection, value => $$invalidate(67, $targetDirection = value));
    	const sourceRotation = source.rotation;
    	validate_store(sourceRotation, 'sourceRotation');
    	component_subscribe($$self, sourceRotation, value => $$invalidate(75, $sourceRotation = value));
    	const targetRotation = target.rotation;
    	validate_store(targetRotation, 'targetRotation');
    	component_subscribe($$self, targetRotation, value => $$invalidate(74, $targetRotation = value));
    	const sourcePositionStore = source.position;
    	validate_store(sourcePositionStore, 'sourcePositionStore');
    	component_subscribe($$self, sourcePositionStore, value => $$invalidate(79, $sourcePositionStore = value));
    	const targetPositionStore = target.position;
    	validate_store(targetPositionStore, 'targetPositionStore');
    	component_subscribe($$self, targetPositionStore, value => $$invalidate(78, $targetPositionStore = value));
    	const sourceDynamic = source.dynamic;
    	validate_store(sourceDynamic, 'sourceDynamic');
    	component_subscribe($$self, sourceDynamic, value => $$invalidate(71, $sourceDynamic = value));
    	const targetDynamic = target.dynamic;
    	validate_store(targetDynamic, 'targetDynamic');
    	component_subscribe($$self, targetDynamic, value => $$invalidate(70, $targetDynamic = value));
    	const sourceMoving = source.moving;
    	validate_store(sourceMoving, 'sourceMoving');
    	component_subscribe($$self, sourceMoving, value => $$invalidate(73, $sourceMoving = value));
    	const targetMoving = target.moving;
    	validate_store(targetMoving, 'targetMoving');
    	component_subscribe($$self, targetMoving, value => $$invalidate(72, $targetMoving = value));
    	const sourceNodePositionStore = source.node?.position;
    	validate_store(sourceNodePositionStore, 'sourceNodePositionStore');
    	component_subscribe($$self, sourceNodePositionStore, value => $$invalidate(77, $sourceNodePositionStore = value));
    	const targetNodePositionStore = target.node?.position;
    	validate_store(targetNodePositionStore, 'targetNodePositionStore');
    	component_subscribe($$self, targetNodePositionStore, value => $$invalidate(76, $targetNodePositionStore = value));
    	const edgeType = edge.type;
    	validate_store(edgeType, 'edgeType');
    	component_subscribe($$self, edgeType, value => $$invalidate(69, $edgeType = value));
    	const edgeKey = edge.id;
    	let path;
    	let DOMPath;
    	let pathMidPoint = { x: 0, y: 0 };
    	let tracking = false;
    	let prefersVertical = false;
    	let sourceAbove = false;
    	let sourceLeft = false;

    	onMount(() => {
    		setTimeout(
    			() => {
    				if (DOMPath) {
    					$$invalidate(10, pathMidPoint = calculatePath(DOMPath));
    				}
    			},
    			0
    		);
    	});

    	afterUpdate(() => {
    		if (DOMPath) {
    			$$invalidate(10, pathMidPoint = calculatePath(DOMPath));
    		}
    	});

    	onDestroy(() => {
    		cancelAnimationFrame(animationFrameId$1);
    	});

    	function trackPath() {
    		if (!tracking) return;

    		if (DOMPath) {
    			$$invalidate(10, pathMidPoint = calculatePath(DOMPath));
    		}

    		animationFrameId$1 = requestAnimationFrame(trackPath);
    	}

    	function destroy() {
    		if (source.id === null || target.id === null) return;
    		const edgeKey2 = edgeStore.match(source, target);
    		edgeStore.delete(edgeKey2[0]);

    		source?.connected.update(connected => {
    			if (target) connected.delete(target);
    			return connected;
    		});

    		target?.connected.update(connected => {
    			if (source) connected.delete(source);
    			return connected;
    		});
    	}

    	const writable_props = [
    		'edge',
    		'straight',
    		'step',
    		'animate',
    		'label',
    		'edgeClick',
    		'width',
    		'color',
    		'labelColor',
    		'textColor',
    		'cornerRadius',
    		'targetColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Edge> was created with unknown prop '${key}'`);
    	});

    	function path_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			DOMPath = $$value;
    			$$invalidate(9, DOMPath);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('edge' in $$props) $$invalidate(32, edge = $$props.edge);
    		if ('straight' in $$props) $$invalidate(33, straight = $$props.straight);
    		if ('step' in $$props) $$invalidate(34, step = $$props.step);
    		if ('animate' in $$props) $$invalidate(0, animate = $$props.animate);
    		if ('label' in $$props) $$invalidate(35, label = $$props.label);
    		if ('edgeClick' in $$props) $$invalidate(1, edgeClick = $$props.edgeClick);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('color' in $$props) $$invalidate(36, color = $$props.color);
    		if ('labelColor' in $$props) $$invalidate(3, labelColor = $$props.labelColor);
    		if ('textColor' in $$props) $$invalidate(4, textColor = $$props.textColor);
    		if ('cornerRadius' in $$props) $$invalidate(37, cornerRadius = $$props.cornerRadius);
    		if ('targetColor' in $$props) $$invalidate(5, targetColor = $$props.targetColor);
    		if ('$$scope' in $$props) $$invalidate(82, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		calculateStepPath,
    		calculateRadius,
    		calculatePath,
    		onMount,
    		onDestroy,
    		getContext,
    		afterUpdate,
    		directionVectors,
    		stepBuffer,
    		buildPath,
    		rotateVector,
    		buildArcStringKey,
    		constructArcString,
    		get: get_store_value,
    		animationFrameId: animationFrameId$1,
    		edgeStore,
    		edgeStyle,
    		raiseEdgesOnSelect,
    		edgesAboveNode,
    		edge,
    		straight,
    		step,
    		animate,
    		label,
    		edgeClick,
    		width,
    		color,
    		labelColor,
    		textColor,
    		cornerRadius,
    		targetColor,
    		source,
    		target,
    		sourceDirection,
    		targetDirection,
    		sourceRotation,
    		targetRotation,
    		sourcePositionStore,
    		targetPositionStore,
    		sourceDynamic,
    		targetDynamic,
    		sourceMoving,
    		targetMoving,
    		sourceNodePositionStore,
    		targetNodePositionStore,
    		edgeType,
    		edgeKey,
    		path,
    		DOMPath,
    		pathMidPoint,
    		tracking,
    		prefersVertical,
    		sourceAbove,
    		sourceLeft,
    		trackPath,
    		destroy,
    		maxZIndex,
    		zIndex,
    		targetZIndex,
    		sourceZIndex,
    		sourceY,
    		sourceX,
    		targetY,
    		targetX,
    		dynamic,
    		sourceNodePosition,
    		targetNodePosition,
    		renderLabel,
    		controlPointString,
    		targetControlY,
    		targetControlX,
    		sourceControlY,
    		sourceControlX,
    		maxCurveDisplaceY,
    		targetControlVector,
    		maxCurveDisplaceX,
    		sourceControlVector,
    		anchorHeight,
    		anchorWidth,
    		deltaY,
    		deltaX,
    		targetPosition,
    		sourcePosition,
    		labelText,
    		finalColor,
    		edgeLabel,
    		edgeColor,
    		$targetZIndex,
    		$sourceZIndex,
    		$targetDirection,
    		$sourceDirection,
    		$edgeType,
    		$targetDynamic,
    		$sourceDynamic,
    		$targetMoving,
    		$sourceMoving,
    		$targetRotation,
    		$sourceRotation,
    		$targetNodePositionStore,
    		$sourceNodePositionStore,
    		$targetPositionStore,
    		$sourcePositionStore,
    		$edgeLabel,
    		$edgeColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('edge' in $$props) $$invalidate(32, edge = $$props.edge);
    		if ('straight' in $$props) $$invalidate(33, straight = $$props.straight);
    		if ('step' in $$props) $$invalidate(34, step = $$props.step);
    		if ('animate' in $$props) $$invalidate(0, animate = $$props.animate);
    		if ('label' in $$props) $$invalidate(35, label = $$props.label);
    		if ('edgeClick' in $$props) $$invalidate(1, edgeClick = $$props.edgeClick);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('color' in $$props) $$invalidate(36, color = $$props.color);
    		if ('labelColor' in $$props) $$invalidate(3, labelColor = $$props.labelColor);
    		if ('textColor' in $$props) $$invalidate(4, textColor = $$props.textColor);
    		if ('cornerRadius' in $$props) $$invalidate(37, cornerRadius = $$props.cornerRadius);
    		if ('targetColor' in $$props) $$invalidate(5, targetColor = $$props.targetColor);
    		if ('path' in $$props) $$invalidate(8, path = $$props.path);
    		if ('DOMPath' in $$props) $$invalidate(9, DOMPath = $$props.DOMPath);
    		if ('pathMidPoint' in $$props) $$invalidate(10, pathMidPoint = $$props.pathMidPoint);
    		if ('tracking' in $$props) $$invalidate(38, tracking = $$props.tracking);
    		if ('prefersVertical' in $$props) $$invalidate(39, prefersVertical = $$props.prefersVertical);
    		if ('sourceAbove' in $$props) $$invalidate(40, sourceAbove = $$props.sourceAbove);
    		if ('sourceLeft' in $$props) $$invalidate(41, sourceLeft = $$props.sourceLeft);
    		if ('maxZIndex' in $$props) $$invalidate(42, maxZIndex = $$props.maxZIndex);
    		if ('zIndex' in $$props) $$invalidate(11, zIndex = $$props.zIndex);
    		if ('targetZIndex' in $$props) $$subscribe_targetZIndex($$invalidate(12, targetZIndex = $$props.targetZIndex));
    		if ('sourceZIndex' in $$props) $$subscribe_sourceZIndex($$invalidate(13, sourceZIndex = $$props.sourceZIndex));
    		if ('sourceY' in $$props) $$invalidate(43, sourceY = $$props.sourceY);
    		if ('sourceX' in $$props) $$invalidate(44, sourceX = $$props.sourceX);
    		if ('targetY' in $$props) $$invalidate(45, targetY = $$props.targetY);
    		if ('targetX' in $$props) $$invalidate(46, targetX = $$props.targetX);
    		if ('dynamic' in $$props) $$invalidate(47, dynamic = $$props.dynamic);
    		if ('sourceNodePosition' in $$props) $$invalidate(48, sourceNodePosition = $$props.sourceNodePosition);
    		if ('targetNodePosition' in $$props) $$invalidate(49, targetNodePosition = $$props.targetNodePosition);
    		if ('renderLabel' in $$props) $$invalidate(6, renderLabel = $$props.renderLabel);
    		if ('controlPointString' in $$props) $$invalidate(50, controlPointString = $$props.controlPointString);
    		if ('targetControlY' in $$props) $$invalidate(51, targetControlY = $$props.targetControlY);
    		if ('targetControlX' in $$props) $$invalidate(52, targetControlX = $$props.targetControlX);
    		if ('sourceControlY' in $$props) $$invalidate(53, sourceControlY = $$props.sourceControlY);
    		if ('sourceControlX' in $$props) $$invalidate(54, sourceControlX = $$props.sourceControlX);
    		if ('maxCurveDisplaceY' in $$props) $$invalidate(55, maxCurveDisplaceY = $$props.maxCurveDisplaceY);
    		if ('targetControlVector' in $$props) $$invalidate(56, targetControlVector = $$props.targetControlVector);
    		if ('maxCurveDisplaceX' in $$props) $$invalidate(57, maxCurveDisplaceX = $$props.maxCurveDisplaceX);
    		if ('sourceControlVector' in $$props) $$invalidate(58, sourceControlVector = $$props.sourceControlVector);
    		if ('anchorHeight' in $$props) $$invalidate(59, anchorHeight = $$props.anchorHeight);
    		if ('anchorWidth' in $$props) $$invalidate(60, anchorWidth = $$props.anchorWidth);
    		if ('deltaY' in $$props) $$invalidate(61, deltaY = $$props.deltaY);
    		if ('deltaX' in $$props) $$invalidate(62, deltaX = $$props.deltaX);
    		if ('targetPosition' in $$props) $$invalidate(63, targetPosition = $$props.targetPosition);
    		if ('sourcePosition' in $$props) $$invalidate(64, sourcePosition = $$props.sourcePosition);
    		if ('labelText' in $$props) $$invalidate(7, labelText = $$props.labelText);
    		if ('finalColor' in $$props) $$invalidate(14, finalColor = $$props.finalColor);
    		if ('edgeLabel' in $$props) $$subscribe_edgeLabel($$invalidate(15, edgeLabel = $$props.edgeLabel));
    		if ('edgeColor' in $$props) $$subscribe_edgeColor($$invalidate(16, edgeColor = $$props.edgeColor));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[2] & /*$sourceDynamic, $targetDynamic*/ 768) {
    			$$invalidate(47, dynamic = $sourceDynamic || $targetDynamic);
    		}

    		if ($$self.$$.dirty[1] & /*edge*/ 2) {
    			$$subscribe_edgeLabel($$invalidate(15, edgeLabel = edge.label?.text));
    		}

    		if ($$self.$$.dirty[1] & /*color*/ 32 | $$self.$$.dirty[2] & /*$edgeColor*/ 524288) {
    			$$invalidate(14, finalColor = color || $edgeColor || null);
    		}

    		if ($$self.$$.dirty[1] & /*label*/ 16 | $$self.$$.dirty[2] & /*$edgeLabel*/ 262144) {
    			$$invalidate(7, labelText = label || $edgeLabel || "");
    		}

    		if ($$self.$$.dirty[0] & /*labelText*/ 128) {
    			$$invalidate(6, renderLabel = labelText || $$slots.label);
    		}

    		if ($$self.$$.dirty[2] & /*$sourcePositionStore*/ 131072) {
    			$$invalidate(64, sourcePosition = $sourcePositionStore);
    		}

    		if ($$self.$$.dirty[2] & /*$targetPositionStore*/ 65536) {
    			$$invalidate(63, targetPosition = $targetPositionStore);
    		}

    		if ($$self.$$.dirty[2] & /*$sourceNodePositionStore*/ 32768) {
    			$$invalidate(48, sourceNodePosition = $sourceNodePositionStore);
    		}

    		if ($$self.$$.dirty[2] & /*$targetNodePositionStore*/ 16384) {
    			$$invalidate(49, targetNodePosition = $targetNodePositionStore);
    		}

    		if ($$self.$$.dirty[2] & /*sourcePosition*/ 4) {
    			$$invalidate(44, sourceX = sourcePosition.x);
    		}

    		if ($$self.$$.dirty[2] & /*sourcePosition*/ 4) {
    			$$invalidate(43, sourceY = sourcePosition.y);
    		}

    		if ($$self.$$.dirty[2] & /*targetPosition*/ 2) {
    			$$invalidate(46, targetX = targetPosition.x);
    		}

    		if ($$self.$$.dirty[2] & /*targetPosition*/ 2) {
    			$$invalidate(45, targetY = targetPosition.y);
    		}

    		if ($$self.$$.dirty[1] & /*targetX, sourceX*/ 40960) {
    			$$invalidate(62, deltaX = targetX - sourceX);
    		}

    		if ($$self.$$.dirty[1] & /*targetY, sourceY*/ 20480) {
    			$$invalidate(61, deltaY = targetY - sourceY);
    		}

    		if ($$self.$$.dirty[2] & /*deltaX*/ 1) {
    			$$invalidate(60, anchorWidth = Math.abs(deltaX));
    		}

    		if ($$self.$$.dirty[1] & /*deltaY*/ 1073741824) {
    			$$invalidate(59, anchorHeight = Math.abs(deltaY));
    		}

    		if ($$self.$$.dirty[1] & /*anchorWidth*/ 536870912) {
    			$$invalidate(57, maxCurveDisplaceX = Math.max(30, Math.min(600, anchorWidth / 2)));
    		}

    		if ($$self.$$.dirty[1] & /*anchorHeight*/ 268435456) {
    			$$invalidate(55, maxCurveDisplaceY = Math.max(30, Math.min(600, anchorHeight / 2)));
    		}

    		if ($$self.$$.dirty[1] & /*dynamic, targetNodePosition, sourceNodePosition, sourceAbove, sourceLeft*/ 460288) {
    			if (dynamic && source.node && target.node) {
    				const nodeXDelta = targetNodePosition.x - sourceNodePosition.x;
    				const nodeYDelta = targetNodePosition.y - sourceNodePosition.y;
    				$$invalidate(40, sourceAbove = nodeYDelta > 0);
    				$$invalidate(41, sourceLeft = nodeXDelta > 0);
    				let borderDeltaY;
    				let borderDeltaX;

    				if (sourceAbove) {
    					const sourceHeight = get_store_value(source.node.dimensions.height);
    					const sourceBottom = sourceNodePosition.y + sourceHeight;
    					borderDeltaY = targetNodePosition.y - sourceBottom;
    				} else {
    					const targetHeight = get_store_value(target.node.dimensions.height);
    					const targetBottom = targetNodePosition.y + targetHeight;
    					borderDeltaY = sourceNodePosition.y - targetBottom;
    				}

    				if (sourceLeft) {
    					const sourceWidth = get_store_value(source.node.dimensions.width);
    					const sourceRight = sourceNodePosition.x + sourceWidth;
    					borderDeltaX = targetNodePosition.x - sourceRight;
    				} else {
    					const targetWidth = get_store_value(target.node.dimensions.width);
    					const targetRight = targetNodePosition.x + targetWidth;
    					borderDeltaX = sourceNodePosition.x - targetRight;
    				}

    				$$invalidate(39, prefersVertical = borderDeltaY > borderDeltaX);
    			}
    		}

    		if ($$self.$$.dirty[1] & /*dynamic, prefersVertical, sourceAbove, sourceLeft*/ 67328 | $$self.$$.dirty[2] & /*$sourceDynamic, $targetDynamic*/ 768) {
    			if (dynamic) {
    				let newSourceDirection;
    				let newTargetDirection;

    				if (prefersVertical) {
    					newSourceDirection = sourceAbove ? "south" : "north";
    					newTargetDirection = sourceAbove ? "north" : "south";
    				} else {
    					newSourceDirection = sourceLeft ? "east" : "west";
    					newTargetDirection = sourceLeft ? "west" : "east";
    				}

    				if ($sourceDynamic) set_store_value(sourceDirection, $sourceDirection = newSourceDirection, $sourceDirection);
    				if ($targetDynamic) set_store_value(targetDirection, $targetDirection = newTargetDirection, $targetDirection);
    			}
    		}

    		if ($$self.$$.dirty[2] & /*$sourceDirection, $sourceRotation*/ 8256) {
    			$$invalidate(58, sourceControlVector = rotateVector(directionVectors[$sourceDirection], $sourceRotation || 0));
    		}

    		if ($$self.$$.dirty[2] & /*$targetDirection, $targetRotation*/ 4128) {
    			$$invalidate(56, targetControlVector = rotateVector(directionVectors[$targetDirection], $targetRotation || 0));
    		}

    		if ($$self.$$.dirty[1] & /*sourceX, sourceControlVector, maxCurveDisplaceX*/ 201334784) {
    			$$invalidate(54, sourceControlX = sourceX + sourceControlVector.x * maxCurveDisplaceX);
    		}

    		if ($$self.$$.dirty[1] & /*sourceY, sourceControlVector, maxCurveDisplaceY*/ 150999040) {
    			$$invalidate(53, sourceControlY = sourceY + sourceControlVector.y * maxCurveDisplaceY);
    		}

    		if ($$self.$$.dirty[1] & /*targetX, targetControlVector, maxCurveDisplaceX*/ 100696064) {
    			$$invalidate(52, targetControlX = targetX + targetControlVector.x * maxCurveDisplaceX);
    		}

    		if ($$self.$$.dirty[1] & /*targetY, targetControlVector, maxCurveDisplaceY*/ 50348032) {
    			$$invalidate(51, targetControlY = targetY + targetControlVector.y * maxCurveDisplaceY);
    		}

    		if ($$self.$$.dirty[1] & /*sourceControlX, sourceControlY, targetControlX, targetControlY*/ 15728640) {
    			$$invalidate(50, controlPointString = `C ${sourceControlX}, ${sourceControlY} ${targetControlX}, ${targetControlY}`);
    		}

    		if ($$self.$$.dirty[1] & /*step, sourceX, sourceY, straight, controlPointString, targetX, targetY*/ 585740 | $$self.$$.dirty[2] & /*$edgeType*/ 128) {
    			if (!step || edgeKey === "cursor" || $edgeType === "bezier") {
    				$$invalidate(8, path = `M ${sourceX}, ${sourceY} ${!straight && controlPointString} ${targetX}, ${targetY}`);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*renderLabel*/ 64 | $$self.$$.dirty[1] & /*tracking*/ 128 | $$self.$$.dirty[2] & /*$sourceMoving, $targetMoving*/ 3072) {
    			if (renderLabel && !tracking && ($sourceMoving || $targetMoving || edgeKey === "cursor")) {
    				$$invalidate(38, tracking = true);
    				trackPath();
    			} else if (tracking && !$sourceMoving && !$targetMoving && edgeKey !== "cursor") {
    				$$invalidate(38, tracking = false);
    				cancelAnimationFrame(animationFrameId$1);
    			}
    		}

    		if ($$self.$$.dirty[1] & /*step, sourceX, sourceY, targetX, targetY, cornerRadius*/ 61512 | $$self.$$.dirty[2] & /*$edgeType, $sourceDirection, $targetDirection*/ 224) {
    			if (step && edgeKey !== "cursor" && !($edgeType && $edgeType === "bezier")) {
    				const sourceObject = {
    					x: sourceX,
    					y: sourceY,
    					direction: directionVectors[$sourceDirection]
    				};

    				const targetObject = {
    					x: targetX,
    					y: targetY,
    					direction: directionVectors[$targetDirection]
    				};

    				const steps = calculateStepPath(sourceObject, targetObject, stepBuffer);

    				const buildArcStringIfNeeded = (step2, index, radius) => {
    					if (index < steps.length - 1) {
    						const arcStringKey = buildArcStringKey(step2, steps[index + 1]);
    						return constructArcString(radius, arcStringKey);
    					}

    					return "";
    				};

    				$$invalidate(8, path = steps.reduce(
    					(string, step2, index) => {
    						const directionX = Math.sign(step2.x);
    						const directionY = Math.sign(step2.y);
    						let xStep = step2.x;
    						let yStep = step2.y;
    						let arcString = "";

    						if (cornerRadius) {
    							const nextStep = steps[index + 1] || { x: 0, y: 0 };
    							const previousStep = steps[index - 1] || { x: 0, y: 0 };
    							const radiusX = calculateRadius(step2.x, nextStep.x, cornerRadius);
    							const radiusY = calculateRadius(nextStep.y, step2.y, cornerRadius);
    							const previousRadiusX = calculateRadius(previousStep.x, step2.x, cornerRadius);
    							const previousRadiusY = calculateRadius(previousStep.y, step2.y, cornerRadius);
    							const previousRadius = Math.min(previousRadiusX, previousRadiusY);
    							const radius = Math.min(radiusX, radiusY);

    							if (step2.x) {
    								xStep = step2.x - (radius + previousRadius) * directionX;
    							} else {
    								yStep = step2.y - (radius + previousRadius) * directionY;
    							}

    							arcString = buildArcStringIfNeeded(step2, index, radius);
    						}

    						return buildPath(string, xStep, yStep, arcString);
    					},
    					`M ${sourceX}, ${sourceY}`
    				));
    			}
    		}

    		if ($$self.$$.dirty[2] & /*$sourceZIndex, $targetZIndex*/ 24) {
    			$$invalidate(42, maxZIndex = Math.max($sourceZIndex, $targetZIndex));
    		}

    		if ($$self.$$.dirty[1] & /*maxZIndex*/ 2048 | $$self.$$.dirty[2] & /*$sourceZIndex, $targetZIndex*/ 24) {
    			$$invalidate(11, zIndex = edgesAboveNode === "all"
    			? 1e5
    			: edgesAboveNode
    				? maxZIndex
    				: raiseEdgesOnSelect === true
    					? maxZIndex - 1
    					: raiseEdgesOnSelect === "source"
    						? $sourceZIndex - 1
    						: raiseEdgesOnSelect === "target" ? $targetZIndex - 1 : 0);
    		}
    	};

    	$$subscribe_edgeColor($$invalidate(16, edgeColor = source?.edgeColor || target?.edgeColor || null));
    	$$subscribe_sourceZIndex($$invalidate(13, sourceZIndex = source.node.zIndex || 0));
    	$$subscribe_targetZIndex($$invalidate(12, targetZIndex = target.node.zIndex || 0));

    	return [
    		animate,
    		edgeClick,
    		width,
    		labelColor,
    		textColor,
    		targetColor,
    		renderLabel,
    		labelText,
    		path,
    		DOMPath,
    		pathMidPoint,
    		zIndex,
    		targetZIndex,
    		sourceZIndex,
    		finalColor,
    		edgeLabel,
    		edgeColor,
    		sourceDirection,
    		targetDirection,
    		sourceRotation,
    		targetRotation,
    		sourcePositionStore,
    		targetPositionStore,
    		sourceDynamic,
    		targetDynamic,
    		sourceMoving,
    		targetMoving,
    		sourceNodePositionStore,
    		targetNodePositionStore,
    		edgeType,
    		edgeKey,
    		destroy,
    		edge,
    		straight,
    		step,
    		label,
    		color,
    		cornerRadius,
    		tracking,
    		prefersVertical,
    		sourceAbove,
    		sourceLeft,
    		maxZIndex,
    		sourceY,
    		sourceX,
    		targetY,
    		targetX,
    		dynamic,
    		sourceNodePosition,
    		targetNodePosition,
    		controlPointString,
    		targetControlY,
    		targetControlX,
    		sourceControlY,
    		sourceControlX,
    		maxCurveDisplaceY,
    		targetControlVector,
    		maxCurveDisplaceX,
    		sourceControlVector,
    		anchorHeight,
    		anchorWidth,
    		deltaY,
    		deltaX,
    		targetPosition,
    		sourcePosition,
    		$targetZIndex,
    		$sourceZIndex,
    		$targetDirection,
    		$sourceDirection,
    		$edgeType,
    		$targetDynamic,
    		$sourceDynamic,
    		$targetMoving,
    		$sourceMoving,
    		$targetRotation,
    		$sourceRotation,
    		$targetNodePositionStore,
    		$sourceNodePositionStore,
    		$targetPositionStore,
    		$sourcePositionStore,
    		$edgeLabel,
    		$edgeColor,
    		$$scope,
    		slots,
    		path_1_binding
    	];
    }

    class Edge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$g,
    			create_fragment$g,
    			safe_not_equal,
    			{
    				edge: 32,
    				straight: 33,
    				step: 34,
    				animate: 0,
    				label: 35,
    				edgeClick: 1,
    				width: 2,
    				color: 36,
    				labelColor: 3,
    				textColor: 4,
    				cornerRadius: 37,
    				targetColor: 5
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edge",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get edge() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edge(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get straight() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set straight(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeClick() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeClick(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelColor() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelColor(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cornerRadius() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cornerRadius(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targetColor() {
    		throw new Error("<Edge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targetColor(value) {
    		throw new Error("<Edge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Edge/EdgeContext.svelte generated by Svelte v3.58.0 */

    function create_fragment$f(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EdgeContext', slots, ['default']);
    	let { edge } = $$props;
    	setContext("edge", edge);

    	$$self.$$.on_mount.push(function () {
    		if (edge === undefined && !('edge' in $$props || $$self.$$.bound[$$self.$$.props['edge']])) {
    			console.warn("<EdgeContext> was created without expected prop 'edge'");
    		}
    	});

    	const writable_props = ['edge'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EdgeContext> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('edge' in $$props) $$invalidate(0, edge = $$props.edge);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ setContext, edge });

    	$$self.$inject_state = $$props => {
    		if ('edge' in $$props) $$invalidate(0, edge = $$props.edge);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [edge, $$scope, slots];
    }

    class EdgeContext extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { edge: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EdgeContext",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get edge() {
    		throw new Error("<EdgeContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edge(value) {
    		throw new Error("<EdgeContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/renderers/EdgeRenderer/EdgeRenderer.svelte generated by Svelte v3.58.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i][0];
    	child_ctx[4] = list[i][1];
    	const constants_0 = /*edge*/ child_ctx[4].component;
    	child_ctx[5] = constants_0;
    	return child_ctx;
    }

    // (14:1) {:else}
    function create_else_block$2(ctx) {
    	let internaledge;
    	let current;

    	internaledge = new Edge({
    			props: { edge: /*edge*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(internaledge.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(internaledge, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const internaledge_changes = {};
    			if (dirty & /*$edges*/ 1) internaledge_changes.edge = /*edge*/ ctx[4];
    			internaledge.$set(internaledge_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(internaledge.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(internaledge.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(internaledge, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(14:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:1) {#if CustomEdge}
    function create_if_block$5(ctx) {
    	let edgecontext;
    	let current;

    	edgecontext = new EdgeContext({
    			props: {
    				edge: /*edge*/ ctx[4],
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(edgecontext.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(edgecontext, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const edgecontext_changes = {};
    			if (dirty & /*$edges*/ 1) edgecontext_changes.edge = /*edge*/ ctx[4];

    			if (dirty & /*$$scope*/ 256) {
    				edgecontext_changes.$$scope = { dirty, ctx };
    			}

    			edgecontext.$set(edgecontext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(edgecontext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(edgecontext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(edgecontext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(10:1) {#if CustomEdge}",
    		ctx
    	});

    	return block;
    }

    // (11:2) <EdgeContext {edge}>
    function create_default_slot$4(ctx) {
    	let customedge;
    	let t;
    	let current;
    	customedge = new /*CustomEdge*/ ctx[5]({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(customedge.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(customedge, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(customedge.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(customedge.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(customedge, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(11:2) <EdgeContext {edge}>",
    		ctx
    	});

    	return block;
    }

    // (8:0) {#each Array.from($edges) as [edgeKey, edge] (edgeKey)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*CustomEdge*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(8:0) {#each Array.from($edges) as [edgeKey, edge] (edgeKey)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = Array.from(/*$edges*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*edgeKey*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array, $edges*/ 1) {
    				each_value = Array.from(/*$edges*/ ctx[0]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $edges;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EdgeRenderer', slots, []);
    	const graph = getContext("graph");
    	const edges = graph.edges;
    	validate_store(edges, 'edges');
    	component_subscribe($$self, edges, value => $$invalidate(0, $edges = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EdgeRenderer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getContext,
    		InternalEdge: Edge,
    		EdgeContext,
    		graph,
    		edges,
    		$edges
    	});

    	return [$edges, edges];
    }

    class EdgeRenderer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EdgeRenderer",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* node_modules/svelvet/dist/containers/ZoomPanWrapper/ZoomPanWrapper.svelte generated by Svelte v3.58.0 */
    const file$b = "node_modules/svelvet/dist/containers/ZoomPanWrapper/ZoomPanWrapper.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelvet-graph-wrapper svelte-19pa6i0");
    			attr_dev(div, "role", "presentation");
    			set_style(div, "transform", /*transform*/ ctx[0]);
    			add_location(div, file$b, 30, 0, 961);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "contextmenu", self(prevent_default(/*contextmenu_handler*/ ctx[12])), false, true, false, false),
    					listen_dev(div, "click", self(prevent_default(/*click_handler*/ ctx[13])), false, true, false, false),
    					listen_dev(div, "touchstart", self(prevent_default(/*touchstart_handler*/ ctx[14])), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*transform*/ 1) {
    				set_style(div, "transform", /*transform*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let graphTranslation;
    	let transform;
    	let $cursor;
    	let $translation;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ZoomPanWrapper', slots, ['default']);
    	const graph = getContext("graph");
    	const transforms = graph.transforms;
    	const scale = transforms.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(9, $scale = value));
    	const translation = transforms.translation;
    	validate_store(translation, 'translation');
    	component_subscribe($$self, translation, value => $$invalidate(8, $translation = value));
    	const cursor = graph.cursor;
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, value => $$invalidate(15, $cursor = value));
    	let { isMovable } = $$props;
    	let animationFrameId;
    	let moving = false;

    	function translate() {
    		set_store_value(translation, $translation = updateTranslation(get_store_value(initialClickPosition), $cursor, transforms), $translation);
    		$$invalidate(5, animationFrameId = requestAnimationFrame(translate));
    	}

    	$$self.$$.on_mount.push(function () {
    		if (isMovable === undefined && !('isMovable' in $$props || $$self.$$.bound[$$self.$$.props['isMovable']])) {
    			console.warn("<ZoomPanWrapper> was created without expected prop 'isMovable'");
    		}
    	});

    	const writable_props = ['isMovable'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ZoomPanWrapper> was created with unknown prop '${key}'`);
    	});

    	function contextmenu_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function touchstart_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('isMovable' in $$props) $$invalidate(4, isMovable = $$props.isMovable);
    		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		initialClickPosition,
    		updateTranslation,
    		get: get_store_value,
    		graph,
    		transforms,
    		scale,
    		translation,
    		cursor,
    		isMovable,
    		animationFrameId,
    		moving,
    		translate,
    		graphTranslation,
    		transform,
    		$cursor,
    		$translation,
    		$scale
    	});

    	$$self.$inject_state = $$props => {
    		if ('isMovable' in $$props) $$invalidate(4, isMovable = $$props.isMovable);
    		if ('animationFrameId' in $$props) $$invalidate(5, animationFrameId = $$props.animationFrameId);
    		if ('moving' in $$props) $$invalidate(6, moving = $$props.moving);
    		if ('graphTranslation' in $$props) $$invalidate(7, graphTranslation = $$props.graphTranslation);
    		if ('transform' in $$props) $$invalidate(0, transform = $$props.transform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$translation*/ 256) {
    			$$invalidate(7, graphTranslation = $translation);
    		}

    		if ($$self.$$.dirty & /*graphTranslation, $scale*/ 640) {
    			$$invalidate(0, transform = `translate(${graphTranslation.x}px, ${graphTranslation.y}px) scale(${$scale})`);
    		}

    		if ($$self.$$.dirty & /*isMovable, moving, animationFrameId*/ 112) {
    			if (isMovable && !moving) {
    				$$invalidate(6, moving = true);
    				$$invalidate(5, animationFrameId = requestAnimationFrame(translate));
    			} else if (!isMovable || !moving) {
    				$$invalidate(6, moving = false);
    				cancelAnimationFrame(animationFrameId);
    			}
    		}
    	};

    	return [
    		transform,
    		scale,
    		translation,
    		cursor,
    		isMovable,
    		animationFrameId,
    		moving,
    		graphTranslation,
    		$translation,
    		$scale,
    		$$scope,
    		slots,
    		contextmenu_handler,
    		click_handler,
    		touchstart_handler
    	];
    }

    class ZoomPanWrapper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { isMovable: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ZoomPanWrapper",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get isMovable() {
    		throw new Error("<ZoomPanWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMovable(value) {
    		throw new Error("<ZoomPanWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/renderers/GraphRenderer/GraphRenderer.svelte generated by Svelte v3.58.0 */

    // (27:0) <ZoomPanWrapper {isMovable}>
    function create_default_slot$3(ctx) {
    	let t0;
    	let edgerenderer;
    	let t1;
    	let groupboxrenderer;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	edgerenderer = new EdgeRenderer({ $$inline: true });
    	groupboxrenderer = new GroupBoxRenderer({ $$inline: true });
    	groupboxrenderer.$on("groupClick", /*handleGroupClicked*/ ctx[5]);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t0 = space();
    			create_component(edgerenderer.$$.fragment);
    			t1 = space();
    			create_component(groupboxrenderer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			mount_component(edgerenderer, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(groupboxrenderer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(edgerenderer.$$.fragment, local);
    			transition_in(groupboxrenderer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(edgerenderer.$$.fragment, local);
    			transition_out(groupboxrenderer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(edgerenderer, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(groupboxrenderer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(27:0) <ZoomPanWrapper {isMovable}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let zoompanwrapper;
    	let current;

    	zoompanwrapper = new ZoomPanWrapper({
    			props: {
    				isMovable: /*isMovable*/ ctx[0],
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(zoompanwrapper.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(zoompanwrapper, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const zoompanwrapper_changes = {};
    			if (dirty & /*isMovable*/ 1) zoompanwrapper_changes.isMovable = /*isMovable*/ ctx[0];

    			if (dirty & /*$$scope*/ 512) {
    				zoompanwrapper_changes.$$scope = { dirty, ctx };
    			}

    			zoompanwrapper.$set(zoompanwrapper_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(zoompanwrapper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(zoompanwrapper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(zoompanwrapper, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $groups;
    	let $initialNodePositions;
    	let $cursor;
    	let $initialClickPosition;
    	let $activeGroup;
    	let $tracking;
    	validate_store(initialClickPosition, 'initialClickPosition');
    	component_subscribe($$self, initialClickPosition, $$value => $$invalidate(13, $initialClickPosition = $$value));
    	validate_store(tracking, 'tracking');
    	component_subscribe($$self, tracking, $$value => $$invalidate(7, $tracking = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GraphRenderer', slots, ['default']);
    	const graph = getContext("graph");
    	const snapTo = getContext("snapTo");
    	let { isMovable } = $$props;
    	const activeGroup = graph.activeGroup;
    	validate_store(activeGroup, 'activeGroup');
    	component_subscribe($$self, activeGroup, value => $$invalidate(6, $activeGroup = value));
    	const groups = graph.groups;
    	validate_store(groups, 'groups');
    	component_subscribe($$self, groups, value => $$invalidate(10, $groups = value));
    	const initialNodePositions = graph.initialNodePositions;
    	validate_store(initialNodePositions, 'initialNodePositions');
    	component_subscribe($$self, initialNodePositions, value => $$invalidate(11, $initialNodePositions = value));
    	const cursor = graph.cursor;
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, value => $$invalidate(12, $cursor = value));

    	function handleGroupClicked(event) {
    		set_store_value(tracking, $tracking = true, $tracking);
    		const { groupName } = event.detail;
    		set_store_value(activeGroup, $activeGroup = groupName, $activeGroup);
    		set_store_value(initialClickPosition, $initialClickPosition = $cursor, $initialClickPosition);
    		set_store_value(initialNodePositions, $initialNodePositions = captureGroup($groups[groupName].nodes), $initialNodePositions);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (isMovable === undefined && !('isMovable' in $$props || $$self.$$.bound[$$self.$$.props['isMovable']])) {
    			console.warn("<GraphRenderer> was created without expected prop 'isMovable'");
    		}
    	});

    	const writable_props = ['isMovable'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GraphRenderer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('isMovable' in $$props) $$invalidate(0, isMovable = $$props.isMovable);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		GroupBoxRenderer,
    		EdgeRenderer,
    		ZoomPanWrapper,
    		initialClickPosition,
    		tracking,
    		captureGroup,
    		moveNodes,
    		getContext,
    		graph,
    		snapTo,
    		isMovable,
    		activeGroup,
    		groups,
    		initialNodePositions,
    		cursor,
    		handleGroupClicked,
    		$groups,
    		$initialNodePositions,
    		$cursor,
    		$initialClickPosition,
    		$activeGroup,
    		$tracking
    	});

    	$$self.$inject_state = $$props => {
    		if ('isMovable' in $$props) $$invalidate(0, isMovable = $$props.isMovable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeGroup, $tracking*/ 192) {
    			if ($activeGroup && $tracking) {
    				moveNodes(graph, snapTo);
    			}
    		}
    	};

    	return [
    		isMovable,
    		activeGroup,
    		groups,
    		initialNodePositions,
    		cursor,
    		handleGroupClicked,
    		$activeGroup,
    		$tracking,
    		slots,
    		$$scope
    	];
    }

    class GraphRenderer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { isMovable: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GraphRenderer",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get isMovable() {
    		throw new Error("<GraphRenderer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMovable(value) {
    		throw new Error("<GraphRenderer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/containers/Background/Background.svelte generated by Svelte v3.58.0 */
    const file$a = "node_modules/svelvet/dist/containers/Background/Background.svelte";

    // (59:32) 
    function create_if_block_1$2(ctx) {
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", /*dotCenterCoordinate*/ ctx[8]);
    			attr_dev(line0, "y1", 0);
    			attr_dev(line0, "x2", /*dotCenterCoordinate*/ ctx[8]);
    			attr_dev(line0, "y2", /*gridScale*/ ctx[5]);
    			attr_dev(line0, "stroke-width", /*radius*/ ctx[4]);
    			add_location(line0, file$a, 59, 5, 1547);
    			attr_dev(line1, "y1", /*dotCenterCoordinate*/ ctx[8]);
    			attr_dev(line1, "x1", 0);
    			attr_dev(line1, "y2", /*dotCenterCoordinate*/ ctx[8]);
    			attr_dev(line1, "x2", /*gridScale*/ ctx[5]);
    			attr_dev(line1, "stroke-width", /*radius*/ ctx[4]);
    			add_location(line1, file$a, 66, 5, 1690);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line0, anchor);
    			insert_dev(target, line1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dotCenterCoordinate*/ 256) {
    				attr_dev(line0, "x1", /*dotCenterCoordinate*/ ctx[8]);
    			}

    			if (dirty & /*dotCenterCoordinate*/ 256) {
    				attr_dev(line0, "x2", /*dotCenterCoordinate*/ ctx[8]);
    			}

    			if (dirty & /*gridScale*/ 32) {
    				attr_dev(line0, "y2", /*gridScale*/ ctx[5]);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(line0, "stroke-width", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*dotCenterCoordinate*/ 256) {
    				attr_dev(line1, "y1", /*dotCenterCoordinate*/ ctx[8]);
    			}

    			if (dirty & /*dotCenterCoordinate*/ 256) {
    				attr_dev(line1, "y2", /*dotCenterCoordinate*/ ctx[8]);
    			}

    			if (dirty & /*gridScale*/ 32) {
    				attr_dev(line1, "x2", /*gridScale*/ ctx[5]);
    			}

    			if (dirty & /*radius*/ 16) {
    				attr_dev(line1, "stroke-width", /*radius*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line0);
    			if (detaching) detach_dev(line1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(59:32) ",
    		ctx
    	});

    	return block;
    }

    // (51:4) {#if style === 'dots'}
    function create_if_block$4(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "background-dot svelte-1iqxg5z");
    			attr_dev(circle, "r", /*radius*/ ctx[4]);
    			attr_dev(circle, "cx", /*dotCenterCoordinate*/ ctx[8]);
    			attr_dev(circle, "cy", /*dotCenterCoordinate*/ ctx[8]);
    			set_style(circle, "--calculated-dot-color", /*dotColor*/ ctx[2]);
    			add_location(circle, file$a, 51, 5, 1339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*radius*/ 16) {
    				attr_dev(circle, "r", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*dotCenterCoordinate*/ 256) {
    				attr_dev(circle, "cx", /*dotCenterCoordinate*/ ctx[8]);
    			}

    			if (dirty & /*dotCenterCoordinate*/ 256) {
    				attr_dev(circle, "cy", /*dotCenterCoordinate*/ ctx[8]);
    			}

    			if (dirty & /*dotColor*/ 4) {
    				set_style(circle, "--calculated-dot-color", /*dotColor*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(51:4) {#if style === 'dots'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let svg;
    	let defs;
    	let pattern;
    	let rect;

    	function select_block_type(ctx, dirty) {
    		if (/*style*/ ctx[0] === 'dots') return create_if_block$4;
    		if (/*style*/ ctx[0] === 'lines') return create_if_block_1$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			pattern = svg_element("pattern");
    			if (if_block) if_block.c();
    			rect = svg_element("rect");
    			attr_dev(pattern, "id", "graph-pattern");
    			attr_dev(pattern, "x", /*backgroundOffsetX*/ ctx[6]);
    			attr_dev(pattern, "y", /*backgroundOffsetY*/ ctx[7]);
    			attr_dev(pattern, "width", /*gridScale*/ ctx[5]);
    			attr_dev(pattern, "height", /*gridScale*/ ctx[5]);
    			attr_dev(pattern, "patternUnits", "userSpaceOnUse");
    			add_location(pattern, file$a, 42, 3, 1139);
    			add_location(defs, file$a, 41, 2, 1129);
    			attr_dev(rect, "width", "100%");
    			attr_dev(rect, "height", "100%");
    			attr_dev(rect, "fill", "url(#graph-pattern)");
    			add_location(rect, file$a, 76, 2, 1864);
    			attr_dev(svg, "class", "svelte-1iqxg5z");
    			add_location(svg, file$a, 40, 1, 1121);
    			attr_dev(div, "id", "background-wrapper");
    			attr_dev(div, "class", "svelte-1iqxg5z");
    			set_style(div, "--calculated-background-color", /*bgColor*/ ctx[1]);
    			add_location(div, file$a, 35, 0, 1010);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, defs);
    			append_dev(defs, pattern);
    			if (if_block) if_block.m(pattern, null);
    			append_dev(svg, rect);
    			/*div_binding*/ ctx[19](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(pattern, null);
    				}
    			}

    			if (dirty & /*backgroundOffsetX*/ 64) {
    				attr_dev(pattern, "x", /*backgroundOffsetX*/ ctx[6]);
    			}

    			if (dirty & /*backgroundOffsetY*/ 128) {
    				attr_dev(pattern, "y", /*backgroundOffsetY*/ ctx[7]);
    			}

    			if (dirty & /*gridScale*/ 32) {
    				attr_dev(pattern, "width", /*gridScale*/ ctx[5]);
    			}

    			if (dirty & /*gridScale*/ 32) {
    				attr_dev(pattern, "height", /*gridScale*/ ctx[5]);
    			}

    			if (dirty & /*bgColor*/ 2) {
    				set_style(div, "--calculated-background-color", /*bgColor*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}

    			/*div_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let graphTranslation;
    	let scale;
    	let gridScale;
    	let radius;
    	let dotCenterCoordinate;
    	let $scaleStore;
    	let $translationStore;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Background', slots, []);
    	const graph = getContext("graph");
    	let { style = "dots" } = $$props;
    	let { gridWidth = GRID_SCALE } = $$props;
    	let { dotSize = DOT_WIDTH } = $$props;
    	let { bgColor = null } = $$props;
    	let { dotColor = null } = $$props;
    	const transforms = graph.transforms;
    	const scaleStore = transforms.scale;
    	validate_store(scaleStore, 'scaleStore');
    	component_subscribe($$self, scaleStore, value => $$invalidate(17, $scaleStore = value));
    	const translationStore = transforms.translation;
    	validate_store(translationStore, 'translationStore');
    	component_subscribe($$self, translationStore, value => $$invalidate(18, $translationStore = value));
    	let backgroundWrapper;
    	let svgWidth;
    	let svgHeight;
    	let backgroundOffsetX;
    	let backgroundOffsetY;
    	const writable_props = ['style', 'gridWidth', 'dotSize', 'bgColor', 'dotColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Background> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			backgroundWrapper = $$value;
    			$$invalidate(3, backgroundWrapper);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('gridWidth' in $$props) $$invalidate(11, gridWidth = $$props.gridWidth);
    		if ('dotSize' in $$props) $$invalidate(12, dotSize = $$props.dotSize);
    		if ('bgColor' in $$props) $$invalidate(1, bgColor = $$props.bgColor);
    		if ('dotColor' in $$props) $$invalidate(2, dotColor = $$props.dotColor);
    	};

    	$$self.$capture_state = () => ({
    		DOT_WIDTH,
    		GRID_SCALE,
    		getContext,
    		graph,
    		style,
    		gridWidth,
    		dotSize,
    		bgColor,
    		dotColor,
    		transforms,
    		scaleStore,
    		translationStore,
    		backgroundWrapper,
    		svgWidth,
    		svgHeight,
    		backgroundOffsetX,
    		backgroundOffsetY,
    		graphTranslation,
    		scale,
    		radius,
    		gridScale,
    		dotCenterCoordinate,
    		$scaleStore,
    		$translationStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('gridWidth' in $$props) $$invalidate(11, gridWidth = $$props.gridWidth);
    		if ('dotSize' in $$props) $$invalidate(12, dotSize = $$props.dotSize);
    		if ('bgColor' in $$props) $$invalidate(1, bgColor = $$props.bgColor);
    		if ('dotColor' in $$props) $$invalidate(2, dotColor = $$props.dotColor);
    		if ('backgroundWrapper' in $$props) $$invalidate(3, backgroundWrapper = $$props.backgroundWrapper);
    		if ('svgWidth' in $$props) $$invalidate(13, svgWidth = $$props.svgWidth);
    		if ('svgHeight' in $$props) $$invalidate(14, svgHeight = $$props.svgHeight);
    		if ('backgroundOffsetX' in $$props) $$invalidate(6, backgroundOffsetX = $$props.backgroundOffsetX);
    		if ('backgroundOffsetY' in $$props) $$invalidate(7, backgroundOffsetY = $$props.backgroundOffsetY);
    		if ('graphTranslation' in $$props) $$invalidate(15, graphTranslation = $$props.graphTranslation);
    		if ('scale' in $$props) $$invalidate(16, scale = $$props.scale);
    		if ('radius' in $$props) $$invalidate(4, radius = $$props.radius);
    		if ('gridScale' in $$props) $$invalidate(5, gridScale = $$props.gridScale);
    		if ('dotCenterCoordinate' in $$props) $$invalidate(8, dotCenterCoordinate = $$props.dotCenterCoordinate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$translationStore*/ 262144) {
    			$$invalidate(15, graphTranslation = $translationStore);
    		}

    		if ($$self.$$.dirty & /*$scaleStore*/ 131072) {
    			$$invalidate(16, scale = $scaleStore);
    		}

    		if ($$self.$$.dirty & /*scale, gridWidth*/ 67584) {
    			$$invalidate(5, gridScale = scale * gridWidth);
    		}

    		if ($$self.$$.dirty & /*scale, dotSize*/ 69632) {
    			$$invalidate(4, radius = scale * dotSize / 2);
    		}

    		if ($$self.$$.dirty & /*gridScale*/ 32) {
    			$$invalidate(8, dotCenterCoordinate = gridScale / 2);
    		}

    		if ($$self.$$.dirty & /*backgroundWrapper, svgWidth, radius, scale, graphTranslation, svgHeight*/ 122904) {
    			{
    				$$invalidate(13, svgWidth = backgroundWrapper?.offsetWidth || 0);
    				$$invalidate(14, svgHeight = backgroundWrapper?.offsetHeight || 0);
    				$$invalidate(6, backgroundOffsetX = (svgWidth + radius) * (1 - scale) / 2 + graphTranslation.x);
    				$$invalidate(7, backgroundOffsetY = (svgHeight + radius) * (1 - scale) / 2 + graphTranslation.y);
    			}
    		}
    	};

    	return [
    		style,
    		bgColor,
    		dotColor,
    		backgroundWrapper,
    		radius,
    		gridScale,
    		backgroundOffsetX,
    		backgroundOffsetY,
    		dotCenterCoordinate,
    		scaleStore,
    		translationStore,
    		gridWidth,
    		dotSize,
    		svgWidth,
    		svgHeight,
    		graphTranslation,
    		scale,
    		$scaleStore,
    		$translationStore,
    		div_binding
    	];
    }

    class Background extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			style: 0,
    			gridWidth: 11,
    			dotSize: 12,
    			bgColor: 1,
    			dotColor: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Background",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get style() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridWidth() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridWidth(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dotSize() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dotSize(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dotColor() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dotColor(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/SelectionBox/SelectionBox.svelte generated by Svelte v3.58.0 */
    const file$9 = "node_modules/svelvet/dist/components/SelectionBox/SelectionBox.svelte";

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "selection-box svelte-10ds4jd");
    			toggle_class(div0, "creating", /*creating*/ ctx[0]);
    			add_location(div0, file$9, 73, 1, 1998);
    			attr_dev(div1, "class", "selection-border svelte-10ds4jd");
    			toggle_class(div1, "creating", /*creating*/ ctx[0]);
    			set_style(div1, "--prop-selection-box-color", /*color*/ ctx[1]);
    			set_style(div1, "height", /*CSSheight*/ ctx[4]);
    			set_style(div1, "width", /*CSSwidth*/ ctx[3]);
    			set_style(div1, "top", /*CSStop*/ ctx[6]);
    			set_style(div1, "left", /*CSSleft*/ ctx[5]);
    			add_location(div1, file$9, 64, 0, 1814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[18](div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*creating*/ 1) {
    				toggle_class(div0, "creating", /*creating*/ ctx[0]);
    			}

    			if (dirty & /*creating*/ 1) {
    				toggle_class(div1, "creating", /*creating*/ ctx[0]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--prop-selection-box-color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*CSSheight*/ 16) {
    				set_style(div1, "height", /*CSSheight*/ ctx[4]);
    			}

    			if (dirty & /*CSSwidth*/ 8) {
    				set_style(div1, "width", /*CSSwidth*/ ctx[3]);
    			}

    			if (dirty & /*CSStop*/ 64) {
    				set_style(div1, "top", /*CSStop*/ ctx[6]);
    			}

    			if (dirty & /*CSSleft*/ 32) {
    				set_style(div1, "left", /*CSSleft*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*div0_binding*/ ctx[18](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let selectedNodes;
    	let height;
    	let width;
    	let top;
    	let left;
    	let CSStop;
    	let CSSleft;
    	let CSSheight;
    	let CSSwidth;

    	let $selectedNodes,
    		$$unsubscribe_selectedNodes = noop,
    		$$subscribe_selectedNodes = () => ($$unsubscribe_selectedNodes(), $$unsubscribe_selectedNodes = subscribe(selectedNodes, $$value => $$invalidate(20, $selectedNodes = $$value)), selectedNodes);

    	let $cursorPositionRaw;
    	let $groups;
    	validate_store(cursorPositionRaw, 'cursorPositionRaw');
    	component_subscribe($$self, cursorPositionRaw, $$value => $$invalidate(16, $cursorPositionRaw = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_selectedNodes());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SelectionBox', slots, []);
    	let { graph } = $$props;
    	let { anchor } = $$props;
    	let { adding = false } = $$props;
    	let { creating = false } = $$props;
    	let { color = null } = $$props;
    	const { groups } = graph;
    	validate_store(groups, 'groups');
    	component_subscribe($$self, groups, value => $$invalidate(17, $groups = value));
    	let nodes;
    	let box;
    	onMount(updateNodes);

    	function updateNodes() {
    		const DOMnodes = Array.from(document.querySelectorAll(".svelvet-node"));

    		nodes = DOMnodes.map(node => {
    			const { top: top2, left: left2, width: width2, height: height2 } = node.getBoundingClientRect();

    			return {
    				id: node.id,
    				top: top2,
    				left: left2,
    				width: width2,
    				height: height2
    			};
    		});
    	}

    	function selectNodes() {
    		if (!nodes) return;

    		const nodesUnderSelection = nodes.reduce(
    			(accumulator, node) => {
    				if (left + anchor.left <= node.left && top + anchor.top <= node.top && left + anchor.left + Math.abs(width) >= node.left + node.width && top + anchor.top + Math.abs(height) >= node.top + node.height) {
    					const id = node.id;
    					const selectedNode = graph.nodes.get(id);
    					if (!selectedNode) return accumulator;
    					accumulator.push(selectedNode);
    				}

    				return accumulator;
    			},
    			[]
    		);

    		if (adding) {
    			nodesUnderSelection.forEach(node => {
    				$selectedNodes.add(node);
    			});
    		} else {
    			set_store_value(selectedNodes, $selectedNodes = new Set(nodesUnderSelection), $selectedNodes);
    		}

    		selectedNodes.set($selectedNodes);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (graph === undefined && !('graph' in $$props || $$self.$$.bound[$$self.$$.props['graph']])) {
    			console.warn("<SelectionBox> was created without expected prop 'graph'");
    		}

    		if (anchor === undefined && !('anchor' in $$props || $$self.$$.bound[$$self.$$.props['anchor']])) {
    			console.warn("<SelectionBox> was created without expected prop 'anchor'");
    		}
    	});

    	const writable_props = ['graph', 'anchor', 'adding', 'creating', 'color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SelectionBox> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			box = $$value;
    			$$invalidate(2, box);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('graph' in $$props) $$invalidate(9, graph = $$props.graph);
    		if ('anchor' in $$props) $$invalidate(10, anchor = $$props.anchor);
    		if ('adding' in $$props) $$invalidate(11, adding = $$props.adding);
    		if ('creating' in $$props) $$invalidate(0, creating = $$props.creating);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		cursorPositionRaw,
    		graph,
    		anchor,
    		adding,
    		creating,
    		color,
    		groups,
    		nodes,
    		box,
    		updateNodes,
    		selectNodes,
    		height,
    		top,
    		width,
    		left,
    		CSSwidth,
    		CSSheight,
    		CSSleft,
    		CSStop,
    		selectedNodes,
    		$selectedNodes,
    		$cursorPositionRaw,
    		$groups
    	});

    	$$self.$inject_state = $$props => {
    		if ('graph' in $$props) $$invalidate(9, graph = $$props.graph);
    		if ('anchor' in $$props) $$invalidate(10, anchor = $$props.anchor);
    		if ('adding' in $$props) $$invalidate(11, adding = $$props.adding);
    		if ('creating' in $$props) $$invalidate(0, creating = $$props.creating);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('nodes' in $$props) nodes = $$props.nodes;
    		if ('box' in $$props) $$invalidate(2, box = $$props.box);
    		if ('height' in $$props) $$invalidate(12, height = $$props.height);
    		if ('top' in $$props) $$invalidate(13, top = $$props.top);
    		if ('width' in $$props) $$invalidate(14, width = $$props.width);
    		if ('left' in $$props) $$invalidate(15, left = $$props.left);
    		if ('CSSwidth' in $$props) $$invalidate(3, CSSwidth = $$props.CSSwidth);
    		if ('CSSheight' in $$props) $$invalidate(4, CSSheight = $$props.CSSheight);
    		if ('CSSleft' in $$props) $$invalidate(5, CSSleft = $$props.CSSleft);
    		if ('CSStop' in $$props) $$invalidate(6, CSStop = $$props.CSStop);
    		if ('selectedNodes' in $$props) $$subscribe_selectedNodes($$invalidate(7, selectedNodes = $$props.selectedNodes));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$groups*/ 131072) {
    			$$subscribe_selectedNodes($$invalidate(7, selectedNodes = $groups.selected.nodes));
    		}

    		if ($$self.$$.dirty & /*$cursorPositionRaw, anchor*/ 66560) {
    			$$invalidate(12, height = $cursorPositionRaw.y - anchor.y - anchor.top);
    		}

    		if ($$self.$$.dirty & /*$cursorPositionRaw, anchor*/ 66560) {
    			$$invalidate(14, width = $cursorPositionRaw.x - anchor.x - anchor.left);
    		}

    		if ($$self.$$.dirty & /*anchor, height*/ 5120) {
    			$$invalidate(13, top = Math.min(anchor.y, anchor.y + height));
    		}

    		if ($$self.$$.dirty & /*anchor, width*/ 17408) {
    			$$invalidate(15, left = Math.min(anchor.x, anchor.x + width));
    		}

    		if ($$self.$$.dirty & /*top*/ 8192) {
    			$$invalidate(6, CSStop = `${top}px`);
    		}

    		if ($$self.$$.dirty & /*left*/ 32768) {
    			$$invalidate(5, CSSleft = `${left}px`);
    		}

    		if ($$self.$$.dirty & /*height*/ 4096) {
    			$$invalidate(4, CSSheight = `${Math.abs(height)}px`);
    		}

    		if ($$self.$$.dirty & /*width*/ 16384) {
    			$$invalidate(3, CSSwidth = `${Math.abs(width)}px`);
    		}

    		if ($$self.$$.dirty & /*width, height*/ 20480) {
    			if (width || height) {
    				selectNodes();
    			}
    		}
    	};

    	return [
    		creating,
    		color,
    		box,
    		CSSwidth,
    		CSSheight,
    		CSSleft,
    		CSStop,
    		selectedNodes,
    		groups,
    		graph,
    		anchor,
    		adding,
    		height,
    		top,
    		width,
    		left,
    		$cursorPositionRaw,
    		$groups,
    		div0_binding
    	];
    }

    class SelectionBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			graph: 9,
    			anchor: 10,
    			adding: 11,
    			creating: 0,
    			color: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectionBox",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get graph() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set graph(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get anchor() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set anchor(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get adding() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set adding(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get creating() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set creating(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/containers/Graph/Graph.svelte generated by Svelte v3.58.0 */
    const file$8 = "node_modules/svelvet/dist/containers/Graph/Graph.svelte";
    const get_toggle_slot_changes$1 = dirty => ({});
    const get_toggle_slot_context$1 = ctx => ({});
    const get_controls_slot_changes$1 = dirty => ({});
    const get_controls_slot_context$1 = ctx => ({});
    const get_minimap_slot_changes$1 = dirty => ({});
    const get_minimap_slot_context$1 = ctx => ({});
    const get_background_slot_changes$1 = dirty => ({});
    const get_background_slot_context$1 = ctx => ({});

    // (412:2) {#if $editing}
    function create_if_block_5(ctx) {
    	let editor;
    	let current;

    	editor = new Editor({
    			props: { editing: /*$editing*/ ctx[18] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editor_changes = {};
    			if (dirty[0] & /*$editing*/ 262144) editor_changes.editing = /*$editing*/ ctx[18];
    			editor.$set(editor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(412:2) {#if $editing}",
    		ctx
    	});

    	return block;
    }

    // (411:1) <GraphRenderer {isMovable}>
    function create_default_slot$2(ctx) {
    	let t;
    	let current;
    	let if_block = /*$editing*/ ctx[18] && create_if_block_5(ctx);
    	const default_slot_template = /*#slots*/ ctx[50].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[52], null);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$editing*/ ctx[18]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$editing*/ 262144) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 2097152)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[52],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[52])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[52], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(411:1) <GraphRenderer {isMovable}>",
    		ctx
    	});

    	return block;
    }

    // (419:1) {:else}
    function create_else_block$1(ctx) {
    	let background;
    	let current;
    	background = new Background({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(background.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(background, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(background, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(419:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (417:1) {#if backgroundExists}
    function create_if_block_4(ctx) {
    	let current;
    	const background_slot_template = /*#slots*/ ctx[50].background;
    	const background_slot = create_slot(background_slot_template, ctx, /*$$scope*/ ctx[52], get_background_slot_context$1);

    	const block = {
    		c: function create() {
    			if (background_slot) background_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (background_slot) {
    				background_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (background_slot) {
    				if (background_slot.p && (!current || dirty[1] & /*$$scope*/ 2097152)) {
    					update_slot_base(
    						background_slot,
    						background_slot_template,
    						ctx,
    						/*$$scope*/ ctx[52],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[52])
    						: get_slot_changes(background_slot_template, /*$$scope*/ ctx[52], dirty, get_background_slot_changes$1),
    						get_background_slot_context$1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (background_slot) background_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(417:1) {#if backgroundExists}",
    		ctx
    	});

    	return block;
    }

    // (422:1) {#if minimap}
    function create_if_block_3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*minimapComponent*/ ctx[10];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*minimapComponent*/ 1024 && switch_value !== (switch_value = /*minimapComponent*/ ctx[10])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(422:1) {#if minimap}",
    		ctx
    	});

    	return block;
    }

    // (425:1) {#if controls}
    function create_if_block_2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*controlsComponent*/ ctx[11];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*controlsComponent*/ 2048 && switch_value !== (switch_value = /*controlsComponent*/ ctx[11])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(425:1) {#if controls}",
    		ctx
    	});

    	return block;
    }

    // (428:1) {#if toggle}
    function create_if_block_1$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*toggleComponent*/ ctx[9];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*toggleComponent*/ 512 && switch_value !== (switch_value = /*toggleComponent*/ ctx[9])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(428:1) {#if toggle}",
    		ctx
    	});

    	return block;
    }

    // (435:1) {#if selecting && !disableSelection}
    function create_if_block$3(ctx) {
    	let selectionbox;
    	let current;

    	selectionbox = new SelectionBox({
    			props: {
    				creating: /*creating*/ ctx[14],
    				anchor: /*anchor*/ ctx[12],
    				graph: /*graph*/ ctx[0],
    				adding: /*adding*/ ctx[15],
    				color: /*selectionColor*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(selectionbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selectionbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const selectionbox_changes = {};
    			if (dirty[0] & /*creating*/ 16384) selectionbox_changes.creating = /*creating*/ ctx[14];
    			if (dirty[0] & /*anchor*/ 4096) selectionbox_changes.anchor = /*anchor*/ ctx[12];
    			if (dirty[0] & /*graph*/ 1) selectionbox_changes.graph = /*graph*/ ctx[0];
    			if (dirty[0] & /*adding*/ 32768) selectionbox_changes.adding = /*adding*/ ctx[15];
    			if (dirty[0] & /*selectionColor*/ 128) selectionbox_changes.color = /*selectionColor*/ ctx[7];
    			selectionbox.$set(selectionbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectionbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectionbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selectionbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(435:1) {#if selecting && !disableSelection}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let section;
    	let graphrenderer;
    	let t0;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let section_id_value;
    	let current;
    	let mounted;
    	let dispose;

    	graphrenderer = new GraphRenderer({
    			props: {
    				isMovable: /*isMovable*/ ctx[16],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*backgroundExists*/ ctx[8]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*minimap*/ ctx[3] && create_if_block_3(ctx);
    	let if_block2 = /*controls*/ ctx[4] && create_if_block_2(ctx);
    	let if_block3 = /*toggle*/ ctx[5] && create_if_block_1$1(ctx);
    	const minimap_slot_template = /*#slots*/ ctx[50].minimap;
    	const minimap_slot = create_slot(minimap_slot_template, ctx, /*$$scope*/ ctx[52], get_minimap_slot_context$1);
    	const controls_slot_template = /*#slots*/ ctx[50].controls;
    	const controls_slot = create_slot(controls_slot_template, ctx, /*$$scope*/ ctx[52], get_controls_slot_context$1);
    	const toggle_slot_template = /*#slots*/ ctx[50].toggle;
    	const toggle_slot = create_slot(toggle_slot_template, ctx, /*$$scope*/ ctx[52], get_toggle_slot_context$1);
    	let if_block4 = /*selecting*/ ctx[13] && !/*disableSelection*/ ctx[6] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(graphrenderer.$$.fragment);
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			t4 = space();
    			if (minimap_slot) minimap_slot.c();
    			t5 = space();
    			if (controls_slot) controls_slot.c();
    			t6 = space();
    			if (toggle_slot) toggle_slot.c();
    			t7 = space();
    			if (if_block4) if_block4.c();
    			attr_dev(section, "id", section_id_value = /*graph*/ ctx[0].id);
    			attr_dev(section, "class", "svelvet-wrapper svelte-fp2i9j");
    			attr_dev(section, "title", "graph");
    			attr_dev(section, "tabindex", 0);
    			set_style(section, "width", /*width*/ ctx[1] ? /*width*/ ctx[1] + 'px' : '100%');
    			set_style(section, "height", /*height*/ ctx[2] ? /*height*/ ctx[2] + 'px' : '100%');
    			add_location(section, file$8, 395, 0, 12275);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(graphrenderer, section, null);
    			append_dev(section, t0);
    			if_blocks[current_block_type_index].m(section, null);
    			append_dev(section, t1);
    			if (if_block1) if_block1.m(section, null);
    			append_dev(section, t2);
    			if (if_block2) if_block2.m(section, null);
    			append_dev(section, t3);
    			if (if_block3) if_block3.m(section, null);
    			append_dev(section, t4);

    			if (minimap_slot) {
    				minimap_slot.m(section, null);
    			}

    			append_dev(section, t5);

    			if (controls_slot) {
    				controls_slot.m(section, null);
    			}

    			append_dev(section, t6);

    			if (toggle_slot) {
    				toggle_slot.m(section, null);
    			}

    			append_dev(section, t7);
    			if (if_block4) if_block4.m(section, null);
    			/*section_binding*/ ctx[51](section);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "touchend", /*onMouseUp*/ ctx[31], false, false, false, false),
    					listen_dev(window, "mouseup", /*onMouseUp*/ ctx[31], false, false, false, false),
    					listen_dev(window, "resize", /*updateGraphDimensions*/ ctx[30], false, false, false, false),
    					listen_dev(section, "wheel", prevent_default(/*handleScroll*/ ctx[37]), false, true, false, false),
    					listen_dev(section, "mousedown", self(prevent_default(/*onMouseDown*/ ctx[32])), false, true, false, false),
    					listen_dev(section, "touchend", prevent_default(/*onTouchEnd*/ ctx[34]), false, true, false, false),
    					listen_dev(section, "touchstart", self(prevent_default(/*onTouchStart*/ ctx[33])), false, true, false, false),
    					listen_dev(section, "keydown", /*handleKeyDown*/ ctx[35], false, false, false, false),
    					listen_dev(section, "keyup", /*handleKeyUp*/ ctx[36], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const graphrenderer_changes = {};
    			if (dirty[0] & /*isMovable*/ 65536) graphrenderer_changes.isMovable = /*isMovable*/ ctx[16];

    			if (dirty[0] & /*$editing*/ 262144 | dirty[1] & /*$$scope*/ 2097152) {
    				graphrenderer_changes.$$scope = { dirty, ctx };
    			}

    			graphrenderer.$set(graphrenderer_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(section, t1);
    			}

    			if (/*minimap*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*minimap*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(section, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*controls*/ ctx[4]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*controls*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(section, t3);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*toggle*/ ctx[5]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*toggle*/ 32) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(section, t4);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (minimap_slot) {
    				if (minimap_slot.p && (!current || dirty[1] & /*$$scope*/ 2097152)) {
    					update_slot_base(
    						minimap_slot,
    						minimap_slot_template,
    						ctx,
    						/*$$scope*/ ctx[52],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[52])
    						: get_slot_changes(minimap_slot_template, /*$$scope*/ ctx[52], dirty, get_minimap_slot_changes$1),
    						get_minimap_slot_context$1
    					);
    				}
    			}

    			if (controls_slot) {
    				if (controls_slot.p && (!current || dirty[1] & /*$$scope*/ 2097152)) {
    					update_slot_base(
    						controls_slot,
    						controls_slot_template,
    						ctx,
    						/*$$scope*/ ctx[52],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[52])
    						: get_slot_changes(controls_slot_template, /*$$scope*/ ctx[52], dirty, get_controls_slot_changes$1),
    						get_controls_slot_context$1
    					);
    				}
    			}

    			if (toggle_slot) {
    				if (toggle_slot.p && (!current || dirty[1] & /*$$scope*/ 2097152)) {
    					update_slot_base(
    						toggle_slot,
    						toggle_slot_template,
    						ctx,
    						/*$$scope*/ ctx[52],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[52])
    						: get_slot_changes(toggle_slot_template, /*$$scope*/ ctx[52], dirty, get_toggle_slot_changes$1),
    						get_toggle_slot_context$1
    					);
    				}
    			}

    			if (/*selecting*/ ctx[13] && !/*disableSelection*/ ctx[6]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*selecting, disableSelection*/ 8256) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(section, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*graph*/ 1 && section_id_value !== (section_id_value = /*graph*/ ctx[0].id)) {
    				attr_dev(section, "id", section_id_value);
    			}

    			if (dirty[0] & /*width*/ 2) {
    				set_style(section, "width", /*width*/ ctx[1] ? /*width*/ ctx[1] + 'px' : '100%');
    			}

    			if (dirty[0] & /*height*/ 4) {
    				set_style(section, "height", /*height*/ ctx[2] ? /*height*/ ctx[2] + 'px' : '100%');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graphrenderer.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(minimap_slot, local);
    			transition_in(controls_slot, local);
    			transition_in(toggle_slot, local);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graphrenderer.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(minimap_slot, local);
    			transition_out(controls_slot, local);
    			transition_out(toggle_slot, local);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(graphrenderer);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (minimap_slot) minimap_slot.d(detaching);
    			if (controls_slot) controls_slot.d(detaching);
    			if (toggle_slot) toggle_slot.d(detaching);
    			if (if_block4) if_block4.d();
    			/*section_binding*/ ctx[51](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let animationFrameId;

    function instance$9($$self, $$props, $$invalidate) {
    	let dimensions;
    	let $selected;
    	let $translation;
    	let $scale;
    	let $groups;
    	let $touchDistance;
    	let $cursor;
    	let $initialClickPosition;
    	let $graphDOMElement;
    	let $tracking;
    	let $initialNodePositions;
    	let $activeGroup;
    	let $connectingFrom;
    	let $nodeBounds;
    	let $dimensionsStore;
    	let $editing;
    	validate_store(touchDistance, 'touchDistance');
    	component_subscribe($$self, touchDistance, $$value => $$invalidate(64, $touchDistance = $$value));
    	validate_store(initialClickPosition, 'initialClickPosition');
    	component_subscribe($$self, initialClickPosition, $$value => $$invalidate(66, $initialClickPosition = $$value));
    	validate_store(tracking, 'tracking');
    	component_subscribe($$self, tracking, $$value => $$invalidate(67, $tracking = $$value));
    	validate_store(connectingFrom, 'connectingFrom');
    	component_subscribe($$self, connectingFrom, $$value => $$invalidate(70, $connectingFrom = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Graph', slots, ['default','background','minimap','controls','toggle']);
    	let { graph } = $$props;
    	let { width } = $$props;
    	let { height } = $$props;
    	let { minimap = false } = $$props;
    	let { controls = false } = $$props;
    	let { toggle = false } = $$props;
    	let { fixedZoom = false } = $$props;
    	let { disableSelection = false } = $$props;
    	let { ZOOM_INCREMENT = 0.1 } = $$props;
    	let { PAN_INCREMENT = 50 } = $$props;
    	let { PAN_TIME = 250 } = $$props;
    	let { MAX_SCALE = 3 } = $$props;
    	let { MIN_SCALE = 0.2 } = $$props;
    	let { selectionColor } = $$props;
    	let { backgroundExists } = $$props;
    	let { fitView = false } = $$props;
    	let { trackpadPan } = $$props;
    	let { modifier } = $$props;
    	let { theme = "light" } = $$props;
    	const dispatch = createEventDispatcher();
    	const activeIntervals = {};
    	const duplicate = writable(false);
    	const mounted = writable(0);
    	const graphDOMElement = writable(null);
    	validate_store(graphDOMElement, 'graphDOMElement');
    	component_subscribe($$self, graphDOMElement, value => $$invalidate(17, $graphDOMElement = value));
    	const cursor = graph.cursor;
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, value => $$invalidate(65, $cursor = value));
    	const scale = graph.transforms.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(62, $scale = value));
    	const dimensionsStore = graph.dimensions;
    	validate_store(dimensionsStore, 'dimensionsStore');
    	component_subscribe($$self, dimensionsStore, value => $$invalidate(49, $dimensionsStore = value));
    	const translation = graph.transforms.translation;
    	validate_store(translation, 'translation');
    	component_subscribe($$self, translation, value => $$invalidate(61, $translation = value));
    	const groups = graph.groups;
    	validate_store(groups, 'groups');
    	component_subscribe($$self, groups, value => $$invalidate(63, $groups = value));
    	const groupBoxes = graph.groupBoxes;
    	const selected = $groups.selected.nodes;
    	validate_store(selected, 'selected');
    	component_subscribe($$self, selected, value => $$invalidate(60, $selected = value));
    	const activeGroup = graph.activeGroup;
    	validate_store(activeGroup, 'activeGroup');
    	component_subscribe($$self, activeGroup, value => $$invalidate(69, $activeGroup = value));
    	const initialNodePositions = graph.initialNodePositions;
    	validate_store(initialNodePositions, 'initialNodePositions');
    	component_subscribe($$self, initialNodePositions, value => $$invalidate(68, $initialNodePositions = value));
    	const editing = graph.editing;
    	validate_store(editing, 'editing');
    	component_subscribe($$self, editing, value => $$invalidate(18, $editing = value));
    	const nodeBounds = graph.bounds.nodeBounds;
    	validate_store(nodeBounds, 'nodeBounds');
    	component_subscribe($$self, nodeBounds, value => $$invalidate(71, $nodeBounds = value));
    	let initialDistance = 0;
    	let initialScale = 1;
    	let anchor = { x: 0, y: 0, top: 0, left: 0 };
    	let selecting = false;
    	let creating = false;
    	let adding = false;
    	let isMovable = false;
    	let pinching = false;
    	let initialFit = false;
    	let interval = void 0;
    	let graphDimensions;
    	let toggleComponent = null;
    	let minimapComponent = null;
    	let controlsComponent = null;

    	const cursorAnchor = {
    		id: null,
    		position: graph.cursor,
    		offset: writable({ x: 0, y: 0 }),
    		connected: writable(/* @__PURE__ */
    		new Set()),
    		dynamic: writable(false),
    		edge: null,
    		edgeColor: writable(null),
    		direction: writable("self"),
    		inputKey: null,
    		type: "output",
    		moving: readable(false),
    		store: null,
    		mounted: writable(true),
    		rotation: readable(0),
    		node: {
    			zIndex: writable(Infinity),
    			rotating: writable(false),
    			position: graph.cursor,
    			dimensions: { width: writable(0), height: writable(0) }
    		}
    	};

    	setContext("graphDOMElement", graphDOMElement);
    	setContext("cursorAnchor", cursorAnchor);
    	setContext("duplicate", duplicate);
    	setContext("graph", graph);
    	setContext("transforms", graph.transforms);
    	setContext("dimensions", graph.dimensions);
    	setContext("locked", graph.locked);
    	setContext("groups", graph.groups);
    	setContext("bounds", graph.bounds);
    	setContext("edgeStore", graph.edges);
    	setContext("nodeStore", graph.nodes);
    	setContext("mounted", mounted);

    	onMount(() => {
    		updateGraphDimensions();
    	});

    	async function fitIntoView() {
    		await tick();
    		const { x, y, scale: scale2 } = calculateFitView(graphDimensions, $nodeBounds);

    		if (x !== null && y !== null && scale2 !== null) {
    			graph.transforms.scale.set(scale2);
    			translation.set({ x, y });
    		}
    	}

    	async function loadMinimap() {
    		$$invalidate(10, minimapComponent = (await Promise.resolve().then(function () { return Minimap$1; })).default);
    	}

    	async function loadToggle() {
    		$$invalidate(9, toggleComponent = (await Promise.resolve().then(function () { return ThemeToggle$1; })).default);
    	}

    	async function loadControls() {
    		$$invalidate(11, controlsComponent = (await Promise.resolve().then(function () { return Controls$1; })).default);
    	}

    	function updateGraphDimensions() {
    		if (!$graphDOMElement) return;
    		const DOMRect = $graphDOMElement.getBoundingClientRect();

    		graphDimensions = {
    			top: DOMRect.top,
    			left: DOMRect.left,
    			bottom: DOMRect.bottom,
    			right: DOMRect.right,
    			width: DOMRect.width,
    			height: DOMRect.height
    		};

    		graph.dimensions.set(graphDimensions);
    		if (fitView === "resize") fitIntoView();
    	}

    	function onMouseUp(e) {
    		if (creating) {
    			const groupName = generateKey();
    			const groupKey = `${groupName}/${graph.id}`;
    			const width2 = $cursor.x - $initialClickPosition.x;
    			const height2 = $cursor.y - $initialClickPosition.y;
    			const top = Math.min($initialClickPosition.y, $initialClickPosition.y + height2);
    			const left = Math.min($initialClickPosition.x, $initialClickPosition.x + width2);

    			const dimensions2 = {
    				width: writable(Math.abs(width2)),
    				height: writable(Math.abs(height2))
    			};

    			const position = writable({ x: left, y: top });

    			const groupBox = {
    				group: writable(groupKey),
    				dimensions: dimensions2,
    				position,
    				color: writable(getRandomColor()),
    				moving: writable(false)
    			};

    			groupBoxes.add(groupBox, groupKey);

    			Array.from($selected).forEach(node => {
    				node.group.set(groupKey);
    			});

    			groups.update(groups2 => {
    				const newGroup = {
    					parent: writable(groupBox),
    					nodes: writable(/* @__PURE__ */
    					new Set([...$selected, groupBox]))
    				};

    				groups2[groupKey] = newGroup;
    				return groups2;
    			});

    			set_store_value(
    				selected,
    				$selected = /* @__PURE__ */
    				new Set(),
    				$selected
    			);

    			$$invalidate(14, creating = false);
    			$$invalidate(13, selecting = false);
    		}

    		if ($activeGroup) {
    			const nodeGroupArray = Array.from(get_store_value($groups[$activeGroup].nodes));
    			nodeGroupArray.forEach(node => node.moving.set(false));
    		}

    		const cursorEdge = graph.edges.get("cursor");

    		if (cursorEdge) {
    			graph.edges.delete("cursor");

    			if (!cursorEdge.disconnect) dispatch("edgeDrop", {
    				cursor: $cursor,
    				source: {
    					node: $connectingFrom?.anchor.node.id.slice(2),
    					anchor: $connectingFrom?.anchor.id.split("/")[0].slice(2)
    				}
    			});
    		}

    		set_store_value(activeGroup, $activeGroup = null, $activeGroup);
    		set_store_value(initialClickPosition, $initialClickPosition = { x: 0, y: 0 }, $initialClickPosition);
    		set_store_value(initialNodePositions, $initialNodePositions = [], $initialNodePositions);
    		$$invalidate(13, selecting = false);
    		$$invalidate(16, isMovable = false);
    		set_store_value(tracking, $tracking = false, $tracking);

    		if (!e.shiftKey) {
    			connectingFrom.set(null);
    		}

    		$$invalidate(12, anchor.y = 0, anchor);
    		$$invalidate(12, anchor.x = 0, anchor);
    	}

    	function onMouseDown(e) {
    		if (e.button === 2) return;
    		if ($graphDOMElement) $graphDOMElement.focus();
    		const { clientX, clientY } = e;
    		set_store_value(initialClickPosition, $initialClickPosition = $cursor, $initialClickPosition);

    		if (e.shiftKey || e.metaKey) {
    			e.preventDefault();
    			$$invalidate(13, selecting = true);
    			const { top, left } = dimensions;
    			$$invalidate(12, anchor.y = clientY - top, anchor);
    			$$invalidate(12, anchor.x = clientX - left, anchor);
    			$$invalidate(12, anchor.top = top, anchor);
    			$$invalidate(12, anchor.left = left, anchor);

    			if (e.shiftKey && e.metaKey) {
    				$$invalidate(14, creating = true);
    			} else {
    				$$invalidate(14, creating = false);
    			}

    			if (e.metaKey && !e.shiftKey) {
    				$$invalidate(15, adding = true);
    			} else {
    				$$invalidate(15, adding = false);
    			}
    		} else {
    			$$invalidate(16, isMovable = true);

    			set_store_value(
    				selected,
    				$selected = /* @__PURE__ */
    				new Set(),
    				$selected
    			);

    			selected.set($selected);
    		}
    	}

    	function onTouchStart(e) {
    		set_store_value(
    			selected,
    			$selected = /* @__PURE__ */
    			new Set(),
    			$selected
    		);

    		selected.set($selected);
    		set_store_value(initialClickPosition, $initialClickPosition = $cursor, $initialClickPosition);
    		$$invalidate(16, isMovable = true);

    		if (e.touches.length === 2) {
    			startPinching();
    			initialDistance = $touchDistance;
    			initialScale = $scale;
    		}
    	}

    	function onTouchEnd() {
    		$$invalidate(16, isMovable = false);
    		pinching = false;
    	}

    	function startPinching() {
    		if (!pinching) {
    			pinching = true;
    			animationFrameId = requestAnimationFrame(handlePinch);
    		}
    	}

    	function handlePinch() {
    		if (!pinching) {
    			cancelAnimationFrame(animationFrameId);
    			return;
    		}

    		const newDistance = $touchDistance;
    		const scaleFactor = newDistance / initialDistance;
    		set_store_value(scale, $scale = initialScale * scaleFactor, $scale);
    		animationFrameId = requestAnimationFrame(handlePinch);
    	}

    	function handleKeyDown(e) {
    		const { key, code } = e;
    		const target = e.target;
    		if (code === "KeyR" && e.metaKey) return;
    		if (target.tagName == "INPUT" || target.tagName == "TEXTAREA") return;
    		e.preventDefault();

    		if (code === "KeyA" && e[`${modifier}Key`]) {
    			const unlockedNodes = graph.nodes.getAll().filter(node => !get_store_value(node.locked));
    			set_store_value(selected, $selected = new Set(unlockedNodes), $selected);
    		} else if (isArrow(key)) {
    			handleArrowKey(key, e);
    		} else if (key === "=") {
    			zoomAndTranslate(-1, graph.dimensions, graph.transforms, ZOOM_INCREMENT);
    		} else if (key === "-") {
    			zoomAndTranslate(1, graph.dimensions, graph.transforms, ZOOM_INCREMENT);
    		} else if (key === "0") {
    			fitIntoView();
    		} else if (key === "Control") {
    			$groups["selected"].nodes.set(/* @__PURE__ */ new Set());
    		} else if (code === "KeyD" && e[`${modifier}Key`]) {
    			duplicate.set(true);

    			setTimeout(
    				() => {
    					duplicate.set(false);
    				},
    				100
    			);
    		}
    	}

    	function handleKeyUp(e) {
    		const { key } = e;

    		if (isArrow(key)) {
    			clearInterval(activeIntervals[key]);
    			delete activeIntervals[key];
    		} else if (key === "Shift") {
    			connectingFrom.set(null);
    		}

    		interval = void 0;
    	}

    	function handleScroll(e) {
    		if (fixedZoom) return;
    		const multiplier = e.shiftKey ? 0.15 : 1;
    		const { clientX, clientY, deltaY } = e;
    		const currentTranslation = $translation;
    		const pointerPosition = { x: clientX, y: clientY };

    		if ((trackpadPan || e.metaKey) && deltaY % 1 === 0) {
    			set_store_value(
    				translation,
    				$translation = {
    					x: set_store_value(translation, $translation.x -= e.deltaX, $translation),
    					y: set_store_value(translation, $translation.y -= e.deltaY, $translation)
    				},
    				$translation
    			);

    			return;
    		}

    		if ($scale >= MAX_SCALE && deltaY < 0 || $scale <= MIN_SCALE && deltaY > 0) return;
    		const scrollAdjustment = Math.min(9e-3 * multiplier * Math.abs(deltaY), 0.08);
    		const newScale = calculateZoom($scale, Math.sign(deltaY), scrollAdjustment);
    		const newTranslation = calculateTranslation($scale, newScale, currentTranslation, pointerPosition, graphDimensions);
    		scale.set(newScale);
    		translation.set(newTranslation);
    	}

    	function handleArrowKey(key, e) {
    		const multiplier = e.shiftKey ? 2 : 1;
    		const start = performance.now();
    		const direction = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
    		const leftRight = key === "ArrowLeft" || key === "ArrowRight";
    		const startOffset = leftRight ? $translation.x : $translation.y;
    		const endOffset = startOffset + direction * PAN_INCREMENT * multiplier;

    		if (!activeIntervals[key]) {
    			let interval2 = setInterval(
    				() => {
    					const time = performance.now() - start;

    					if ($selected.size === 0) {
    						const movement = startOffset + (endOffset - startOffset) * (time / PAN_TIME);

    						translation.set({
    							x: leftRight ? movement : $translation.x,
    							y: leftRight ? $translation.y : movement
    						});
    					} else {
    						const delta = {
    							x: leftRight ? direction * 2 : 0,
    							y: leftRight ? 0 : direction * 2
    						};

    						Array.from($selected).forEach(node => {
    							const currentPosition = get_store_value(node.position);
    							let groupBox;
    							const groupName = get_store_value(node.group);
    							const groupBoxes2 = get_store_value(graph.groupBoxes);
    							if (groupName) groupBox = groupBoxes2.get(groupName);

    							if (groupBox) {
    								const nodeWidth = get_store_value(node.dimensions.width);
    								const nodeHeight = get_store_value(node.dimensions.height);
    								const bounds = calculateRelativeBounds(groupBox, nodeWidth, nodeHeight);
    								moveElementWithBounds(currentPosition, delta, node.position, bounds);
    							} else {
    								moveElement(currentPosition, delta, node.position);
    							}
    						});
    					}
    				},
    				2
    			);

    			activeIntervals[key] = interval2;
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (graph === undefined && !('graph' in $$props || $$self.$$.bound[$$self.$$.props['graph']])) {
    			console.warn("<Graph> was created without expected prop 'graph'");
    		}

    		if (width === undefined && !('width' in $$props || $$self.$$.bound[$$self.$$.props['width']])) {
    			console.warn("<Graph> was created without expected prop 'width'");
    		}

    		if (height === undefined && !('height' in $$props || $$self.$$.bound[$$self.$$.props['height']])) {
    			console.warn("<Graph> was created without expected prop 'height'");
    		}

    		if (selectionColor === undefined && !('selectionColor' in $$props || $$self.$$.bound[$$self.$$.props['selectionColor']])) {
    			console.warn("<Graph> was created without expected prop 'selectionColor'");
    		}

    		if (backgroundExists === undefined && !('backgroundExists' in $$props || $$self.$$.bound[$$self.$$.props['backgroundExists']])) {
    			console.warn("<Graph> was created without expected prop 'backgroundExists'");
    		}

    		if (trackpadPan === undefined && !('trackpadPan' in $$props || $$self.$$.bound[$$self.$$.props['trackpadPan']])) {
    			console.warn("<Graph> was created without expected prop 'trackpadPan'");
    		}

    		if (modifier === undefined && !('modifier' in $$props || $$self.$$.bound[$$self.$$.props['modifier']])) {
    			console.warn("<Graph> was created without expected prop 'modifier'");
    		}
    	});

    	const writable_props = [
    		'graph',
    		'width',
    		'height',
    		'minimap',
    		'controls',
    		'toggle',
    		'fixedZoom',
    		'disableSelection',
    		'ZOOM_INCREMENT',
    		'PAN_INCREMENT',
    		'PAN_TIME',
    		'MAX_SCALE',
    		'MIN_SCALE',
    		'selectionColor',
    		'backgroundExists',
    		'fitView',
    		'trackpadPan',
    		'modifier',
    		'theme'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Graph> was created with unknown prop '${key}'`);
    	});

    	function section_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$graphDOMElement = $$value;
    			graphDOMElement.set($graphDOMElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('graph' in $$props) $$invalidate(0, graph = $$props.graph);
    		if ('width' in $$props) $$invalidate(1, width = $$props.width);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('minimap' in $$props) $$invalidate(3, minimap = $$props.minimap);
    		if ('controls' in $$props) $$invalidate(4, controls = $$props.controls);
    		if ('toggle' in $$props) $$invalidate(5, toggle = $$props.toggle);
    		if ('fixedZoom' in $$props) $$invalidate(38, fixedZoom = $$props.fixedZoom);
    		if ('disableSelection' in $$props) $$invalidate(6, disableSelection = $$props.disableSelection);
    		if ('ZOOM_INCREMENT' in $$props) $$invalidate(39, ZOOM_INCREMENT = $$props.ZOOM_INCREMENT);
    		if ('PAN_INCREMENT' in $$props) $$invalidate(40, PAN_INCREMENT = $$props.PAN_INCREMENT);
    		if ('PAN_TIME' in $$props) $$invalidate(41, PAN_TIME = $$props.PAN_TIME);
    		if ('MAX_SCALE' in $$props) $$invalidate(42, MAX_SCALE = $$props.MAX_SCALE);
    		if ('MIN_SCALE' in $$props) $$invalidate(43, MIN_SCALE = $$props.MIN_SCALE);
    		if ('selectionColor' in $$props) $$invalidate(7, selectionColor = $$props.selectionColor);
    		if ('backgroundExists' in $$props) $$invalidate(8, backgroundExists = $$props.backgroundExists);
    		if ('fitView' in $$props) $$invalidate(44, fitView = $$props.fitView);
    		if ('trackpadPan' in $$props) $$invalidate(45, trackpadPan = $$props.trackpadPan);
    		if ('modifier' in $$props) $$invalidate(46, modifier = $$props.modifier);
    		if ('theme' in $$props) $$invalidate(47, theme = $$props.theme);
    		if ('$$scope' in $$props) $$invalidate(52, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		SelectionBox,
    		Background,
    		GraphRenderer,
    		Editor,
    		connectingFrom,
    		onMount,
    		setContext,
    		createEventDispatcher,
    		tick,
    		isArrow,
    		moveElementWithBounds,
    		calculateRelativeBounds,
    		touchDistance,
    		initialClickPosition,
    		tracking,
    		calculateFitView,
    		calculateTranslation,
    		calculateZoom,
    		generateKey,
    		get: get_store_value,
    		writable,
    		readable,
    		getRandomColor,
    		moveElement,
    		zoomAndTranslate,
    		animationFrameId,
    		graph,
    		width,
    		height,
    		minimap,
    		controls,
    		toggle,
    		fixedZoom,
    		disableSelection,
    		ZOOM_INCREMENT,
    		PAN_INCREMENT,
    		PAN_TIME,
    		MAX_SCALE,
    		MIN_SCALE,
    		selectionColor,
    		backgroundExists,
    		fitView,
    		trackpadPan,
    		modifier,
    		theme,
    		dispatch,
    		activeIntervals,
    		duplicate,
    		mounted,
    		graphDOMElement,
    		cursor,
    		scale,
    		dimensionsStore,
    		translation,
    		groups,
    		groupBoxes,
    		selected,
    		activeGroup,
    		initialNodePositions,
    		editing,
    		nodeBounds,
    		initialDistance,
    		initialScale,
    		anchor,
    		selecting,
    		creating,
    		adding,
    		isMovable,
    		pinching,
    		initialFit,
    		interval,
    		graphDimensions,
    		toggleComponent,
    		minimapComponent,
    		controlsComponent,
    		cursorAnchor,
    		fitIntoView,
    		loadMinimap,
    		loadToggle,
    		loadControls,
    		updateGraphDimensions,
    		onMouseUp,
    		onMouseDown,
    		onTouchStart,
    		onTouchEnd,
    		startPinching,
    		handlePinch,
    		handleKeyDown,
    		handleKeyUp,
    		handleScroll,
    		handleArrowKey,
    		dimensions,
    		$selected,
    		$translation,
    		$scale,
    		$groups,
    		$touchDistance,
    		$cursor,
    		$initialClickPosition,
    		$graphDOMElement,
    		$tracking,
    		$initialNodePositions,
    		$activeGroup,
    		$connectingFrom,
    		$nodeBounds,
    		$dimensionsStore,
    		$editing
    	});

    	$$self.$inject_state = $$props => {
    		if ('graph' in $$props) $$invalidate(0, graph = $$props.graph);
    		if ('width' in $$props) $$invalidate(1, width = $$props.width);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('minimap' in $$props) $$invalidate(3, minimap = $$props.minimap);
    		if ('controls' in $$props) $$invalidate(4, controls = $$props.controls);
    		if ('toggle' in $$props) $$invalidate(5, toggle = $$props.toggle);
    		if ('fixedZoom' in $$props) $$invalidate(38, fixedZoom = $$props.fixedZoom);
    		if ('disableSelection' in $$props) $$invalidate(6, disableSelection = $$props.disableSelection);
    		if ('ZOOM_INCREMENT' in $$props) $$invalidate(39, ZOOM_INCREMENT = $$props.ZOOM_INCREMENT);
    		if ('PAN_INCREMENT' in $$props) $$invalidate(40, PAN_INCREMENT = $$props.PAN_INCREMENT);
    		if ('PAN_TIME' in $$props) $$invalidate(41, PAN_TIME = $$props.PAN_TIME);
    		if ('MAX_SCALE' in $$props) $$invalidate(42, MAX_SCALE = $$props.MAX_SCALE);
    		if ('MIN_SCALE' in $$props) $$invalidate(43, MIN_SCALE = $$props.MIN_SCALE);
    		if ('selectionColor' in $$props) $$invalidate(7, selectionColor = $$props.selectionColor);
    		if ('backgroundExists' in $$props) $$invalidate(8, backgroundExists = $$props.backgroundExists);
    		if ('fitView' in $$props) $$invalidate(44, fitView = $$props.fitView);
    		if ('trackpadPan' in $$props) $$invalidate(45, trackpadPan = $$props.trackpadPan);
    		if ('modifier' in $$props) $$invalidate(46, modifier = $$props.modifier);
    		if ('theme' in $$props) $$invalidate(47, theme = $$props.theme);
    		if ('initialDistance' in $$props) initialDistance = $$props.initialDistance;
    		if ('initialScale' in $$props) initialScale = $$props.initialScale;
    		if ('anchor' in $$props) $$invalidate(12, anchor = $$props.anchor);
    		if ('selecting' in $$props) $$invalidate(13, selecting = $$props.selecting);
    		if ('creating' in $$props) $$invalidate(14, creating = $$props.creating);
    		if ('adding' in $$props) $$invalidate(15, adding = $$props.adding);
    		if ('isMovable' in $$props) $$invalidate(16, isMovable = $$props.isMovable);
    		if ('pinching' in $$props) pinching = $$props.pinching;
    		if ('initialFit' in $$props) $$invalidate(48, initialFit = $$props.initialFit);
    		if ('interval' in $$props) interval = $$props.interval;
    		if ('graphDimensions' in $$props) graphDimensions = $$props.graphDimensions;
    		if ('toggleComponent' in $$props) $$invalidate(9, toggleComponent = $$props.toggleComponent);
    		if ('minimapComponent' in $$props) $$invalidate(10, minimapComponent = $$props.minimapComponent);
    		if ('controlsComponent' in $$props) $$invalidate(11, controlsComponent = $$props.controlsComponent);
    		if ('dimensions' in $$props) dimensions = $$props.dimensions;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$dimensionsStore*/ 262144) {
    			dimensions = $dimensionsStore;
    		}

    		if ($$self.$$.dirty[1] & /*theme*/ 65536) {
    			if (theme) document.documentElement.setAttribute("svelvet-theme", theme);
    		}

    		if ($$self.$$.dirty[1] & /*initialFit, fitView*/ 139264) {
    			if (!initialFit && fitView) {
    				fitIntoView();
    				$$invalidate(48, initialFit = true);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*toggle, toggleComponent*/ 544) {
    			if (toggle && !toggleComponent) loadToggle();
    		}

    		if ($$self.$$.dirty[0] & /*minimap, minimapComponent*/ 1032) {
    			if (minimap && !minimapComponent) loadMinimap();
    		}

    		if ($$self.$$.dirty[0] & /*controls, controlsComponent*/ 2064) {
    			if (controls && !controlsComponent) loadControls();
    		}
    	};

    	return [
    		graph,
    		width,
    		height,
    		minimap,
    		controls,
    		toggle,
    		disableSelection,
    		selectionColor,
    		backgroundExists,
    		toggleComponent,
    		minimapComponent,
    		controlsComponent,
    		anchor,
    		selecting,
    		creating,
    		adding,
    		isMovable,
    		$graphDOMElement,
    		$editing,
    		graphDOMElement,
    		cursor,
    		scale,
    		dimensionsStore,
    		translation,
    		groups,
    		selected,
    		activeGroup,
    		initialNodePositions,
    		editing,
    		nodeBounds,
    		updateGraphDimensions,
    		onMouseUp,
    		onMouseDown,
    		onTouchStart,
    		onTouchEnd,
    		handleKeyDown,
    		handleKeyUp,
    		handleScroll,
    		fixedZoom,
    		ZOOM_INCREMENT,
    		PAN_INCREMENT,
    		PAN_TIME,
    		MAX_SCALE,
    		MIN_SCALE,
    		fitView,
    		trackpadPan,
    		modifier,
    		theme,
    		initialFit,
    		$dimensionsStore,
    		slots,
    		section_binding,
    		$$scope
    	];
    }

    class Graph$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$9,
    			create_fragment$9,
    			safe_not_equal,
    			{
    				graph: 0,
    				width: 1,
    				height: 2,
    				minimap: 3,
    				controls: 4,
    				toggle: 5,
    				fixedZoom: 38,
    				disableSelection: 6,
    				ZOOM_INCREMENT: 39,
    				PAN_INCREMENT: 40,
    				PAN_TIME: 41,
    				MAX_SCALE: 42,
    				MIN_SCALE: 43,
    				selectionColor: 7,
    				backgroundExists: 8,
    				fitView: 44,
    				trackpadPan: 45,
    				modifier: 46,
    				theme: 47
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get graph() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set graph(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minimap() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minimap(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controls() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controls(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fixedZoom() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fixedZoom(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableSelection() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableSelection(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ZOOM_INCREMENT() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ZOOM_INCREMENT(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get PAN_INCREMENT() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set PAN_INCREMENT(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get PAN_TIME() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set PAN_TIME(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get MAX_SCALE() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set MAX_SCALE(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get MIN_SCALE() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set MIN_SCALE(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectionColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectionColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backgroundExists() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backgroundExists(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fitView() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fitView(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trackpadPan() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trackpadPan(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modifier() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modifier(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/containers/Svelvet/Svelvet.svelte generated by Svelte v3.58.0 */
    const file$7 = "node_modules/svelvet/dist/containers/Svelvet/Svelvet.svelte";
    const get_minimap_slot_changes = dirty => ({});
    const get_minimap_slot_context = ctx => ({ slot: "minimap" });
    const get_controls_slot_changes = dirty => ({});
    const get_controls_slot_context = ctx => ({ slot: "controls" });
    const get_background_slot_changes = dirty => ({});
    const get_background_slot_context = ctx => ({ slot: "background" });
    const get_toggle_slot_changes = dirty => ({});
    const get_toggle_slot_context = ctx => ({ slot: "toggle" });

    // (84:0) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelvet-temp svelte-as11u1");
    			set_style(div, "width", /*width*/ ctx[2] ? /*width*/ ctx[2] + 'px' : '100%');
    			set_style(div, "height", /*height*/ ctx[3] ? /*height*/ ctx[3] + 'px' : '100%');
    			add_location(div, file$7, 84, 1, 2250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*width*/ 4) {
    				set_style(div, "width", /*width*/ ctx[2] ? /*width*/ ctx[2] + 'px' : '100%');
    			}

    			if (dirty & /*height*/ 8) {
    				set_style(div, "height", /*height*/ ctx[3] ? /*height*/ ctx[3] + 'px' : '100%');
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(84:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:0) {#if graph}
    function create_if_block$2(ctx) {
    	let graph_1;
    	let current;

    	graph_1 = new Graph$1({
    			props: {
    				width: /*width*/ ctx[2],
    				height: /*height*/ ctx[3],
    				toggle: /*toggle*/ ctx[6],
    				backgroundExists: /*backgroundExists*/ ctx[14],
    				minimap: /*minimap*/ ctx[4],
    				graph: /*graph*/ ctx[13],
    				fitView: /*fitView*/ ctx[7],
    				theme: /*theme*/ ctx[1],
    				controls: /*controls*/ ctx[5],
    				selectionColor: /*selectionColor*/ ctx[8],
    				disableSelection: /*disableSelection*/ ctx[9],
    				trackpadPan: /*trackpadPan*/ ctx[11],
    				modifier: /*modifier*/ ctx[12],
    				$$slots: {
    					toggle: [create_toggle_slot$1],
    					background: [create_background_slot],
    					controls: [create_controls_slot],
    					minimap: [create_minimap_slot],
    					default: [create_default_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	graph_1.$on("edgeDrop", /*edgeDrop_handler*/ ctx[27]);

    	const block = {
    		c: function create() {
    			create_component(graph_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(graph_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const graph_1_changes = {};
    			if (dirty & /*width*/ 4) graph_1_changes.width = /*width*/ ctx[2];
    			if (dirty & /*height*/ 8) graph_1_changes.height = /*height*/ ctx[3];
    			if (dirty & /*toggle*/ 64) graph_1_changes.toggle = /*toggle*/ ctx[6];
    			if (dirty & /*backgroundExists*/ 16384) graph_1_changes.backgroundExists = /*backgroundExists*/ ctx[14];
    			if (dirty & /*minimap*/ 16) graph_1_changes.minimap = /*minimap*/ ctx[4];
    			if (dirty & /*graph*/ 8192) graph_1_changes.graph = /*graph*/ ctx[13];
    			if (dirty & /*fitView*/ 128) graph_1_changes.fitView = /*fitView*/ ctx[7];
    			if (dirty & /*theme*/ 2) graph_1_changes.theme = /*theme*/ ctx[1];
    			if (dirty & /*controls*/ 32) graph_1_changes.controls = /*controls*/ ctx[5];
    			if (dirty & /*selectionColor*/ 256) graph_1_changes.selectionColor = /*selectionColor*/ ctx[8];
    			if (dirty & /*disableSelection*/ 512) graph_1_changes.disableSelection = /*disableSelection*/ ctx[9];
    			if (dirty & /*trackpadPan*/ 2048) graph_1_changes.trackpadPan = /*trackpadPan*/ ctx[11];
    			if (dirty & /*modifier*/ 4096) graph_1_changes.modifier = /*modifier*/ ctx[12];

    			if (dirty & /*$$scope, mermaid, mermaidConfig*/ 268436481) {
    				graph_1_changes.$$scope = { dirty, ctx };
    			}

    			graph_1.$set(graph_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graph_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graph_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(graph_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(58:0) {#if graph}",
    		ctx
    	});

    	return block;
    }

    // (75:2) {#if mermaid.length}
    function create_if_block_1(ctx) {
    	let flowchart;
    	let current;

    	flowchart = new FlowChart({
    			props: {
    				mermaid: /*mermaid*/ ctx[0],
    				mermaidConfig: /*mermaidConfig*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flowchart.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flowchart, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const flowchart_changes = {};
    			if (dirty & /*mermaid*/ 1) flowchart_changes.mermaid = /*mermaid*/ ctx[0];
    			if (dirty & /*mermaidConfig*/ 1024) flowchart_changes.mermaidConfig = /*mermaidConfig*/ ctx[10];
    			flowchart.$set(flowchart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flowchart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flowchart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flowchart, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(75:2) {#if mermaid.length}",
    		ctx
    	});

    	return block;
    }

    // (59:1) <Graph   {width}   {height}   {toggle}   {backgroundExists}   {minimap}   {graph}   {fitView}   {theme}   {controls}   {selectionColor}   {disableSelection}   {trackpadPan}   {modifier}   on:edgeDrop  >
    function create_default_slot$1(ctx) {
    	let t;
    	let current;
    	let if_block = /*mermaid*/ ctx[0].length && create_if_block_1(ctx);
    	const default_slot_template = /*#slots*/ ctx[26].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[28], null);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*mermaid*/ ctx[0].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*mermaid*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 268435456)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[28], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(59:1) <Graph   {width}   {height}   {toggle}   {backgroundExists}   {minimap}   {graph}   {fitView}   {theme}   {controls}   {selectionColor}   {disableSelection}   {trackpadPan}   {modifier}   on:edgeDrop  >",
    		ctx
    	});

    	return block;
    }

    // (79:2) 
    function create_minimap_slot(ctx) {
    	let current;
    	const minimap_slot_template = /*#slots*/ ctx[26].minimap;
    	const minimap_slot = create_slot(minimap_slot_template, ctx, /*$$scope*/ ctx[28], get_minimap_slot_context);

    	const block = {
    		c: function create() {
    			if (minimap_slot) minimap_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (minimap_slot) {
    				minimap_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (minimap_slot) {
    				if (minimap_slot.p && (!current || dirty & /*$$scope*/ 268435456)) {
    					update_slot_base(
    						minimap_slot,
    						minimap_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(minimap_slot_template, /*$$scope*/ ctx[28], dirty, get_minimap_slot_changes),
    						get_minimap_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(minimap_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(minimap_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (minimap_slot) minimap_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_minimap_slot.name,
    		type: "slot",
    		source: "(79:2) ",
    		ctx
    	});

    	return block;
    }

    // (80:2) 
    function create_controls_slot(ctx) {
    	let current;
    	const controls_slot_template = /*#slots*/ ctx[26].controls;
    	const controls_slot = create_slot(controls_slot_template, ctx, /*$$scope*/ ctx[28], get_controls_slot_context);

    	const block = {
    		c: function create() {
    			if (controls_slot) controls_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (controls_slot) {
    				controls_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (controls_slot) {
    				if (controls_slot.p && (!current || dirty & /*$$scope*/ 268435456)) {
    					update_slot_base(
    						controls_slot,
    						controls_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(controls_slot_template, /*$$scope*/ ctx[28], dirty, get_controls_slot_changes),
    						get_controls_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(controls_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(controls_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (controls_slot) controls_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_controls_slot.name,
    		type: "slot",
    		source: "(80:2) ",
    		ctx
    	});

    	return block;
    }

    // (81:2) 
    function create_background_slot(ctx) {
    	let current;
    	const background_slot_template = /*#slots*/ ctx[26].background;
    	const background_slot = create_slot(background_slot_template, ctx, /*$$scope*/ ctx[28], get_background_slot_context);

    	const block = {
    		c: function create() {
    			if (background_slot) background_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (background_slot) {
    				background_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (background_slot) {
    				if (background_slot.p && (!current || dirty & /*$$scope*/ 268435456)) {
    					update_slot_base(
    						background_slot,
    						background_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(background_slot_template, /*$$scope*/ ctx[28], dirty, get_background_slot_changes),
    						get_background_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (background_slot) background_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_background_slot.name,
    		type: "slot",
    		source: "(81:2) ",
    		ctx
    	});

    	return block;
    }

    // (82:2) 
    function create_toggle_slot$1(ctx) {
    	let current;
    	const toggle_slot_template = /*#slots*/ ctx[26].toggle;
    	const toggle_slot = create_slot(toggle_slot_template, ctx, /*$$scope*/ ctx[28], get_toggle_slot_context);

    	const block = {
    		c: function create() {
    			if (toggle_slot) toggle_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (toggle_slot) {
    				toggle_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (toggle_slot) {
    				if (toggle_slot.p && (!current || dirty & /*$$scope*/ 268435456)) {
    					update_slot_base(
    						toggle_slot,
    						toggle_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(toggle_slot_template, /*$$scope*/ ctx[28], dirty, get_toggle_slot_changes),
    						get_toggle_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toggle_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toggle_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (toggle_slot) toggle_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_toggle_slot$1.name,
    		type: "slot",
    		source: "(82:2) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*graph*/ ctx[13]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let backgroundExists;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Svelvet', slots, ['toggle','background','controls','minimap','default']);
    	const $$slots = compute_slots(slots);
    	let { mermaid = "" } = $$props;
    	let { theme = "light" } = $$props;
    	let { id = 0 } = $$props;
    	let { snapTo = 0 } = $$props;
    	let { zoom = 1 } = $$props;
    	let { TD = false } = $$props;
    	let { editable = false } = $$props;
    	let { locked = false } = $$props;
    	let { width = 0 } = $$props;
    	let { height = 0 } = $$props;
    	let { minimap = false } = $$props;
    	let { controls = false } = $$props;
    	let { toggle = false } = $$props;
    	let { fitView = false } = $$props;
    	let { selectionColor = "lightblue" } = $$props;
    	let { edgeStyle = "bezier" } = $$props;
    	let { edge = null } = $$props;
    	let { disableSelection = false } = $$props;
    	let { mermaidConfig = {} } = $$props;
    	let { translation = { x: 0, y: 0 } } = $$props;
    	let { trackpadPan = false } = $$props;
    	let { modifier = "meta" } = $$props;
    	let { raiseEdgesOnSelect = false } = $$props;
    	let { edgesAboveNode = false } = $$props;
    	let graph;
    	let direction = TD ? "TD" : "LR";
    	setContext("snapTo", snapTo);
    	setContext("edgeStyle", edgeStyle);
    	setContext("graphEdge", edge);
    	setContext("raiseEdgesOnSelect", raiseEdgesOnSelect);
    	setContext("edgesAboveNode", edgesAboveNode);

    	onMount(() => {
    		const stateObject = localStorage.getItem("state");

    		if (stateObject) {
    			$$invalidate(13, graph = reloadStore(stateObject));
    			graphStore.add(graph, graph.id);
    		} else {
    			let graphKey = `G-${id || graphStore.count() + 1}`;

    			$$invalidate(13, graph = createGraph(graphKey, {
    				zoom,
    				direction,
    				editable,
    				locked,
    				translation
    			}));

    			graphStore.add(graph, graphKey);
    		}
    	});

    	const writable_props = [
    		'mermaid',
    		'theme',
    		'id',
    		'snapTo',
    		'zoom',
    		'TD',
    		'editable',
    		'locked',
    		'width',
    		'height',
    		'minimap',
    		'controls',
    		'toggle',
    		'fitView',
    		'selectionColor',
    		'edgeStyle',
    		'edge',
    		'disableSelection',
    		'mermaidConfig',
    		'translation',
    		'trackpadPan',
    		'modifier',
    		'raiseEdgesOnSelect',
    		'edgesAboveNode'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Svelvet> was created with unknown prop '${key}'`);
    	});

    	function edgeDrop_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('mermaid' in $$props) $$invalidate(0, mermaid = $$props.mermaid);
    		if ('theme' in $$props) $$invalidate(1, theme = $$props.theme);
    		if ('id' in $$props) $$invalidate(15, id = $$props.id);
    		if ('snapTo' in $$props) $$invalidate(16, snapTo = $$props.snapTo);
    		if ('zoom' in $$props) $$invalidate(17, zoom = $$props.zoom);
    		if ('TD' in $$props) $$invalidate(18, TD = $$props.TD);
    		if ('editable' in $$props) $$invalidate(19, editable = $$props.editable);
    		if ('locked' in $$props) $$invalidate(20, locked = $$props.locked);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('height' in $$props) $$invalidate(3, height = $$props.height);
    		if ('minimap' in $$props) $$invalidate(4, minimap = $$props.minimap);
    		if ('controls' in $$props) $$invalidate(5, controls = $$props.controls);
    		if ('toggle' in $$props) $$invalidate(6, toggle = $$props.toggle);
    		if ('fitView' in $$props) $$invalidate(7, fitView = $$props.fitView);
    		if ('selectionColor' in $$props) $$invalidate(8, selectionColor = $$props.selectionColor);
    		if ('edgeStyle' in $$props) $$invalidate(21, edgeStyle = $$props.edgeStyle);
    		if ('edge' in $$props) $$invalidate(22, edge = $$props.edge);
    		if ('disableSelection' in $$props) $$invalidate(9, disableSelection = $$props.disableSelection);
    		if ('mermaidConfig' in $$props) $$invalidate(10, mermaidConfig = $$props.mermaidConfig);
    		if ('translation' in $$props) $$invalidate(23, translation = $$props.translation);
    		if ('trackpadPan' in $$props) $$invalidate(11, trackpadPan = $$props.trackpadPan);
    		if ('modifier' in $$props) $$invalidate(12, modifier = $$props.modifier);
    		if ('raiseEdgesOnSelect' in $$props) $$invalidate(24, raiseEdgesOnSelect = $$props.raiseEdgesOnSelect);
    		if ('edgesAboveNode' in $$props) $$invalidate(25, edgesAboveNode = $$props.edgesAboveNode);
    		if ('$$scope' in $$props) $$invalidate(28, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Graph: Graph$1,
    		FlowChart,
    		onMount,
    		setContext,
    		createGraph,
    		graphStore,
    		reloadStore,
    		mermaid,
    		theme,
    		id,
    		snapTo,
    		zoom,
    		TD,
    		editable,
    		locked,
    		width,
    		height,
    		minimap,
    		controls,
    		toggle,
    		fitView,
    		selectionColor,
    		edgeStyle,
    		edge,
    		disableSelection,
    		mermaidConfig,
    		translation,
    		trackpadPan,
    		modifier,
    		raiseEdgesOnSelect,
    		edgesAboveNode,
    		graph,
    		direction,
    		backgroundExists
    	});

    	$$self.$inject_state = $$props => {
    		if ('mermaid' in $$props) $$invalidate(0, mermaid = $$props.mermaid);
    		if ('theme' in $$props) $$invalidate(1, theme = $$props.theme);
    		if ('id' in $$props) $$invalidate(15, id = $$props.id);
    		if ('snapTo' in $$props) $$invalidate(16, snapTo = $$props.snapTo);
    		if ('zoom' in $$props) $$invalidate(17, zoom = $$props.zoom);
    		if ('TD' in $$props) $$invalidate(18, TD = $$props.TD);
    		if ('editable' in $$props) $$invalidate(19, editable = $$props.editable);
    		if ('locked' in $$props) $$invalidate(20, locked = $$props.locked);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('height' in $$props) $$invalidate(3, height = $$props.height);
    		if ('minimap' in $$props) $$invalidate(4, minimap = $$props.minimap);
    		if ('controls' in $$props) $$invalidate(5, controls = $$props.controls);
    		if ('toggle' in $$props) $$invalidate(6, toggle = $$props.toggle);
    		if ('fitView' in $$props) $$invalidate(7, fitView = $$props.fitView);
    		if ('selectionColor' in $$props) $$invalidate(8, selectionColor = $$props.selectionColor);
    		if ('edgeStyle' in $$props) $$invalidate(21, edgeStyle = $$props.edgeStyle);
    		if ('edge' in $$props) $$invalidate(22, edge = $$props.edge);
    		if ('disableSelection' in $$props) $$invalidate(9, disableSelection = $$props.disableSelection);
    		if ('mermaidConfig' in $$props) $$invalidate(10, mermaidConfig = $$props.mermaidConfig);
    		if ('translation' in $$props) $$invalidate(23, translation = $$props.translation);
    		if ('trackpadPan' in $$props) $$invalidate(11, trackpadPan = $$props.trackpadPan);
    		if ('modifier' in $$props) $$invalidate(12, modifier = $$props.modifier);
    		if ('raiseEdgesOnSelect' in $$props) $$invalidate(24, raiseEdgesOnSelect = $$props.raiseEdgesOnSelect);
    		if ('edgesAboveNode' in $$props) $$invalidate(25, edgesAboveNode = $$props.edgesAboveNode);
    		if ('graph' in $$props) $$invalidate(13, graph = $$props.graph);
    		if ('direction' in $$props) direction = $$props.direction;
    		if ('backgroundExists' in $$props) $$invalidate(14, backgroundExists = $$props.backgroundExists);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*graph, zoom*/ 139264) {
    			if (graph) graph.transforms.scale.set(zoom);
    		}
    	};

    	$$invalidate(14, backgroundExists = $$slots.background);

    	return [
    		mermaid,
    		theme,
    		width,
    		height,
    		minimap,
    		controls,
    		toggle,
    		fitView,
    		selectionColor,
    		disableSelection,
    		mermaidConfig,
    		trackpadPan,
    		modifier,
    		graph,
    		backgroundExists,
    		id,
    		snapTo,
    		zoom,
    		TD,
    		editable,
    		locked,
    		edgeStyle,
    		edge,
    		translation,
    		raiseEdgesOnSelect,
    		edgesAboveNode,
    		slots,
    		edgeDrop_handler,
    		$$scope
    	];
    }

    class Svelvet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			mermaid: 0,
    			theme: 1,
    			id: 15,
    			snapTo: 16,
    			zoom: 17,
    			TD: 18,
    			editable: 19,
    			locked: 20,
    			width: 2,
    			height: 3,
    			minimap: 4,
    			controls: 5,
    			toggle: 6,
    			fitView: 7,
    			selectionColor: 8,
    			edgeStyle: 21,
    			edge: 22,
    			disableSelection: 9,
    			mermaidConfig: 10,
    			translation: 23,
    			trackpadPan: 11,
    			modifier: 12,
    			raiseEdgesOnSelect: 24,
    			edgesAboveNode: 25
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svelvet",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get mermaid() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mermaid(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get snapTo() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set snapTo(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoom() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoom(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get TD() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set TD(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editable() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editable(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get locked() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set locked(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minimap() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minimap(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controls() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controls(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fitView() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fitView(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectionColor() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectionColor(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeStyle() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeStyle(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edge() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edge(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableSelection() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableSelection(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mermaidConfig() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mermaidConfig(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translation() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translation(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trackpadPan() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trackpadPan(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modifier() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modifier(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get raiseEdgesOnSelect() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set raiseEdgesOnSelect(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgesAboveNode() {
    		throw new Error("<Svelvet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgesAboveNode(value) {
    		throw new Error("<Svelvet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Controls/Controls.svelte generated by Svelte v3.58.0 */
    const file$6 = "node_modules/svelvet/dist/components/Controls/Controls.svelte";
    const get_default_slot_changes = dirty => ({});

    const get_default_slot_context = ctx => ({
    	zoomIn: /*zoomIn*/ ctx[12],
    	zoomOut: /*zoomOut*/ ctx[13],
    	fitView: /*fitView*/ ctx[14],
    	lock: /*lock*/ ctx[15],
    	unhideAll: /*unhideAll*/ ctx[11]
    });

    // (51:3) {#if $hidden.size > 0}
    function create_if_block$1(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "visibility_off";
    			attr_dev(span, "class", "material-symbols-outlined svelte-12mnpqh");
    			add_location(span, file$6, 52, 5, 1539);
    			attr_dev(button, "class", "unhide svelte-12mnpqh");
    			add_location(button, file$6, 51, 4, 1469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "mousedown", stop_propagation(/*unhideAll*/ ctx[11]), false, false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(51:3) {#if $hidden.size > 0}",
    		ctx
    	});

    	return block;
    }

    // (44:55)    
    function fallback_block(ctx) {
    	let div;
    	let t0;
    	let button0;
    	let span0;
    	let t2;
    	let button1;
    	let span1;
    	let t4;
    	let button2;
    	let span2;
    	let t6;
    	let button3;
    	let span3;
    	let t7_value = (/*$locked*/ ctx[4] ? 'lock_open' : 'lock') + "";
    	let t7;
    	let mounted;
    	let dispose;
    	let if_block = /*$hidden*/ ctx[5].size > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "zoom_in";
    			t2 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "zoom_out";
    			t4 = space();
    			button2 = element("button");
    			span2 = element("span");
    			span2.textContent = "filter_center_focus";
    			t6 = space();
    			button3 = element("button");
    			span3 = element("span");
    			t7 = text(t7_value);
    			attr_dev(span0, "class", "material-symbols-outlined svelte-12mnpqh");
    			add_location(span0, file$6, 56, 4, 1717);
    			attr_dev(button0, "class", "zoom-in svelte-12mnpqh");
    			add_location(button0, file$6, 55, 3, 1627);
    			attr_dev(span1, "class", "material-symbols-outlined svelte-12mnpqh");
    			add_location(span1, file$6, 59, 4, 1883);
    			attr_dev(button1, "class", "zoom-out svelte-12mnpqh");
    			add_location(button1, file$6, 58, 3, 1790);
    			attr_dev(span2, "class", "material-symbols-outlined svelte-12mnpqh");
    			add_location(span2, file$6, 62, 4, 2047);
    			attr_dev(button2, "class", "reset svelte-12mnpqh");
    			add_location(button2, file$6, 61, 3, 1957);
    			attr_dev(span3, "class", "material-symbols-outlined svelte-12mnpqh");
    			add_location(span3, file$6, 65, 4, 2214);
    			attr_dev(button3, "class", "lock svelte-12mnpqh");
    			add_location(button3, file$6, 64, 3, 2131);
    			attr_dev(div, "class", "controls-wrapper svelte-12mnpqh");
    			toggle_class(div, "horizontal", /*horizontal*/ ctx[0]);
    			set_style(div, "--prop-controls-background-color", /*bgColor*/ ctx[1]);
    			set_style(div, "--prop-controls-text-color", /*iconColor*/ ctx[2]);
    			add_location(div, file$6, 44, 2, 1282);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(button1, span1);
    			append_dev(div, t4);
    			append_dev(div, button2);
    			append_dev(button2, span2);
    			append_dev(div, t6);
    			append_dev(div, button3);
    			append_dev(button3, span3);
    			append_dev(span3, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "mousedown", stop_propagation(/*zoomIn*/ ctx[12]), false, false, true, false),
    					listen_dev(button0, "touchstart", /*zoomIn*/ ctx[12], { passive: true }, false, false, false),
    					listen_dev(button1, "mousedown", stop_propagation(/*zoomOut*/ ctx[13]), false, false, true, false),
    					listen_dev(button1, "touchstart", /*zoomOut*/ ctx[13], { passive: true }, false, false, false),
    					listen_dev(button2, "mousedown", stop_propagation(/*fitView*/ ctx[14]), false, false, true, false),
    					listen_dev(button2, "touchstart", /*fitView*/ ctx[14], { passive: true }, false, false, false),
    					listen_dev(button3, "mousedown", stop_propagation(/*lock*/ ctx[15]), false, false, true, false),
    					listen_dev(button3, "touchstart", /*lock*/ ctx[15], { passive: true }, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$hidden*/ ctx[5].size > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$locked*/ 16 && t7_value !== (t7_value = (/*$locked*/ ctx[4] ? 'lock_open' : 'lock') + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*horizontal*/ 1) {
    				toggle_class(div, "horizontal", /*horizontal*/ ctx[0]);
    			}

    			if (dirty & /*bgColor*/ 2) {
    				set_style(div, "--prop-controls-background-color", /*bgColor*/ ctx[1]);
    			}

    			if (dirty & /*iconColor*/ 4) {
    				set_style(div, "--prop-controls-text-color", /*iconColor*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(44:55)    ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let nav;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(nav, "class", "graph-controls svelte-12mnpqh");
    			attr_dev(nav, "aria-label", "navigation");
    			toggle_class(nav, "SW", /*corner*/ ctx[3] === 'SW');
    			toggle_class(nav, "NE", /*corner*/ ctx[3] === 'NE');
    			toggle_class(nav, "SE", /*corner*/ ctx[3] === 'SE');
    			toggle_class(nav, "NW", /*corner*/ ctx[3] === 'NW');
    			add_location(nav, file$6, 35, 0, 1056);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(nav, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 131072)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[17],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[17])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[17], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*horizontal, bgColor, iconColor, $locked, $hidden*/ 55)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}

    			if (!current || dirty & /*corner*/ 8) {
    				toggle_class(nav, "SW", /*corner*/ ctx[3] === 'SW');
    			}

    			if (!current || dirty & /*corner*/ 8) {
    				toggle_class(nav, "NE", /*corner*/ ctx[3] === 'NE');
    			}

    			if (!current || dirty & /*corner*/ 8) {
    				toggle_class(nav, "SE", /*corner*/ ctx[3] === 'SE');
    			}

    			if (!current || dirty & /*corner*/ 8) {
    				toggle_class(nav, "NW", /*corner*/ ctx[3] === 'NW');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $locked;
    	let $nodeBounds;
    	let $dimensions;
    	let $groups;
    	let $hidden;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Controls', slots, ['default']);
    	let { increment = 0.1 } = $$props;
    	let { horizontal = false } = $$props;
    	let { bgColor = null } = $$props;
    	let { iconColor = null } = $$props;
    	let { corner = "SW" } = $$props;
    	const transforms = getContext("transforms");
    	const dimensions = getContext("dimensions");
    	validate_store(dimensions, 'dimensions');
    	component_subscribe($$self, dimensions, value => $$invalidate(20, $dimensions = value));
    	const locked = getContext("locked");
    	validate_store(locked, 'locked');
    	component_subscribe($$self, locked, value => $$invalidate(4, $locked = value));
    	const groups = getContext("groups");
    	validate_store(groups, 'groups');
    	component_subscribe($$self, groups, value => $$invalidate(21, $groups = value));
    	const bounds = getContext("bounds");
    	const { translation } = transforms;
    	const hidden = $groups.hidden.nodes;
    	validate_store(hidden, 'hidden');
    	component_subscribe($$self, hidden, value => $$invalidate(5, $hidden = value));
    	const nodeBounds = bounds.nodeBounds;
    	validate_store(nodeBounds, 'nodeBounds');
    	component_subscribe($$self, nodeBounds, value => $$invalidate(19, $nodeBounds = value));

    	function unhideAll() {
    		hidden.set(/* @__PURE__ */ new Set());
    	}

    	function zoomIn() {
    		zoomAndTranslate(-1, dimensions, transforms, increment);
    	}

    	function zoomOut() {
    		zoomAndTranslate(1, dimensions, transforms, increment);
    	}

    	function fitView() {
    		const { x, y, scale } = calculateFitView($dimensions, $nodeBounds);
    		translation.set({ x: x || 0, y: y || 0 });
    		transforms.scale.set(scale || 1);
    	}

    	function lock() {
    		set_store_value(locked, $locked = !$locked, $locked);
    	}

    	const writable_props = ['increment', 'horizontal', 'bgColor', 'iconColor', 'corner'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('increment' in $$props) $$invalidate(16, increment = $$props.increment);
    		if ('horizontal' in $$props) $$invalidate(0, horizontal = $$props.horizontal);
    		if ('bgColor' in $$props) $$invalidate(1, bgColor = $$props.bgColor);
    		if ('iconColor' in $$props) $$invalidate(2, iconColor = $$props.iconColor);
    		if ('corner' in $$props) $$invalidate(3, corner = $$props.corner);
    		if ('$$scope' in $$props) $$invalidate(17, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		calculateFitView,
    		zoomAndTranslate,
    		increment,
    		horizontal,
    		bgColor,
    		iconColor,
    		corner,
    		transforms,
    		dimensions,
    		locked,
    		groups,
    		bounds,
    		translation,
    		hidden,
    		nodeBounds,
    		unhideAll,
    		zoomIn,
    		zoomOut,
    		fitView,
    		lock,
    		$locked,
    		$nodeBounds,
    		$dimensions,
    		$groups,
    		$hidden
    	});

    	$$self.$inject_state = $$props => {
    		if ('increment' in $$props) $$invalidate(16, increment = $$props.increment);
    		if ('horizontal' in $$props) $$invalidate(0, horizontal = $$props.horizontal);
    		if ('bgColor' in $$props) $$invalidate(1, bgColor = $$props.bgColor);
    		if ('iconColor' in $$props) $$invalidate(2, iconColor = $$props.iconColor);
    		if ('corner' in $$props) $$invalidate(3, corner = $$props.corner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		horizontal,
    		bgColor,
    		iconColor,
    		corner,
    		$locked,
    		$hidden,
    		dimensions,
    		locked,
    		groups,
    		hidden,
    		nodeBounds,
    		unhideAll,
    		zoomIn,
    		zoomOut,
    		fitView,
    		lock,
    		increment,
    		$$scope,
    		slots
    	];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			increment: 16,
    			horizontal: 0,
    			bgColor: 1,
    			iconColor: 2,
    			corner: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get increment() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set increment(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconColor() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconColor(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get corner() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set corner(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Controls$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Controls
    });

    /* node_modules/svelvet/dist/components/Minimap/MiniNode.svelte generated by Svelte v3.58.0 */
    const file$5 = "node_modules/svelvet/dist/components/Minimap/MiniNode.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let style_border_radius = `${/*$borderRadius*/ ctx[13]}px`;
    	let style_width = `${/*$width*/ ctx[15]}px`;
    	let style_height = `${/*$height*/ ctx[16]}px`;
    	let style_transform = `rotate(${/*nodeRotation*/ ctx[10]}deg)`;
    	let style_top = `${/*nodePosition*/ ctx[11].y - /*top*/ ctx[3]}px`;
    	let style_left = `${/*nodePosition*/ ctx[11].x - /*left*/ ctx[4]}px`;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "minimap-node svelte-1hs9omb");
    			toggle_class(button, "hidden", /*hidden*/ ctx[1]);
    			toggle_class(button, "hideable", /*hideable*/ ctx[6]);
    			set_style(button, "z-index", /*$zIndex*/ ctx[12]);
    			set_style(button, "border-radius", style_border_radius);
    			set_style(button, "--prop-background-color", /*nodeColor*/ ctx[5] || /*$bgColor*/ ctx[14] || !/*colorIsTransparent*/ ctx[8] && /*color*/ ctx[7] || null);
    			set_style(button, "width", style_width);
    			set_style(button, "height", style_height);
    			set_style(button, "transform", style_transform);
    			set_style(button, "top", style_top);
    			set_style(button, "left", style_left);
    			add_location(button, file$5, 27, 0, 650);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[25], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hidden*/ 2) {
    				toggle_class(button, "hidden", /*hidden*/ ctx[1]);
    			}

    			if (dirty & /*hideable*/ 64) {
    				toggle_class(button, "hideable", /*hideable*/ ctx[6]);
    			}

    			if (dirty & /*$zIndex*/ 4096) {
    				set_style(button, "z-index", /*$zIndex*/ ctx[12]);
    			}

    			if (dirty & /*$borderRadius*/ 8192 && style_border_radius !== (style_border_radius = `${/*$borderRadius*/ ctx[13]}px`)) {
    				set_style(button, "border-radius", style_border_radius);
    			}

    			if (dirty & /*nodeColor, $bgColor, colorIsTransparent, color*/ 16800) {
    				set_style(button, "--prop-background-color", /*nodeColor*/ ctx[5] || /*$bgColor*/ ctx[14] || !/*colorIsTransparent*/ ctx[8] && /*color*/ ctx[7] || null);
    			}

    			if (dirty & /*$width*/ 32768 && style_width !== (style_width = `${/*$width*/ ctx[15]}px`)) {
    				set_style(button, "width", style_width);
    			}

    			if (dirty & /*$height*/ 65536 && style_height !== (style_height = `${/*$height*/ ctx[16]}px`)) {
    				set_style(button, "height", style_height);
    			}

    			if (dirty & /*nodeRotation*/ 1024 && style_transform !== (style_transform = `rotate(${/*nodeRotation*/ ctx[10]}deg)`)) {
    				set_style(button, "transform", style_transform);
    			}

    			if (dirty & /*nodePosition, top*/ 2056 && style_top !== (style_top = `${/*nodePosition*/ ctx[11].y - /*top*/ ctx[3]}px`)) {
    				set_style(button, "top", style_top);
    			}

    			if (dirty & /*nodePosition, left*/ 2064 && style_left !== (style_left = `${/*nodePosition*/ ctx[11].x - /*left*/ ctx[4]}px`)) {
    				set_style(button, "left", style_left);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let nodePosition;
    	let nodeRotation;
    	let zIndex;
    	let colorIsTransparent;
    	let $rotation;
    	let $position;

    	let $zIndex,
    		$$unsubscribe_zIndex = noop,
    		$$subscribe_zIndex = () => ($$unsubscribe_zIndex(), $$unsubscribe_zIndex = subscribe(zIndex, $$value => $$invalidate(12, $zIndex = $$value)), zIndex);

    	let $borderRadius;
    	let $bgColor;
    	let $width;
    	let $height;
    	$$self.$$.on_destroy.push(() => $$unsubscribe_zIndex());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MiniNode', slots, []);
    	let { node } = $$props;
    	let { hidden = false } = $$props;
    	let { toggleHidden } = $$props;
    	let { top } = $$props;
    	let { left } = $$props;
    	let { nodeColor = null } = $$props;
    	let { hideable } = $$props;
    	const { position, dimensions, bgColor, borderRadius, rotation } = node;
    	validate_store(position, 'position');
    	component_subscribe($$self, position, value => $$invalidate(24, $position = value));
    	validate_store(bgColor, 'bgColor');
    	component_subscribe($$self, bgColor, value => $$invalidate(14, $bgColor = value));
    	validate_store(borderRadius, 'borderRadius');
    	component_subscribe($$self, borderRadius, value => $$invalidate(13, $borderRadius = value));
    	validate_store(rotation, 'rotation');
    	component_subscribe($$self, rotation, value => $$invalidate(23, $rotation = value));
    	const { width, height } = dimensions;
    	validate_store(width, 'width');
    	component_subscribe($$self, width, value => $$invalidate(15, $width = value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, value => $$invalidate(16, $height = value));
    	let color = null;

    	onMount(() => {
    		const DOMnode = document.querySelector(`#${node.id}`)?.firstChild;

    		if (DOMnode) {
    			$$invalidate(7, color = window.getComputedStyle(DOMnode).backgroundColor);
    		}
    	});

    	$$self.$$.on_mount.push(function () {
    		if (node === undefined && !('node' in $$props || $$self.$$.bound[$$self.$$.props['node']])) {
    			console.warn("<MiniNode> was created without expected prop 'node'");
    		}

    		if (toggleHidden === undefined && !('toggleHidden' in $$props || $$self.$$.bound[$$self.$$.props['toggleHidden']])) {
    			console.warn("<MiniNode> was created without expected prop 'toggleHidden'");
    		}

    		if (top === undefined && !('top' in $$props || $$self.$$.bound[$$self.$$.props['top']])) {
    			console.warn("<MiniNode> was created without expected prop 'top'");
    		}

    		if (left === undefined && !('left' in $$props || $$self.$$.bound[$$self.$$.props['left']])) {
    			console.warn("<MiniNode> was created without expected prop 'left'");
    		}

    		if (hideable === undefined && !('hideable' in $$props || $$self.$$.bound[$$self.$$.props['hideable']])) {
    			console.warn("<MiniNode> was created without expected prop 'hideable'");
    		}
    	});

    	const writable_props = ['node', 'hidden', 'toggleHidden', 'top', 'left', 'nodeColor', 'hideable'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MiniNode> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		if (!hideable) return;
    		toggleHidden(node);
    	};

    	$$self.$$set = $$props => {
    		if ('node' in $$props) $$invalidate(0, node = $$props.node);
    		if ('hidden' in $$props) $$invalidate(1, hidden = $$props.hidden);
    		if ('toggleHidden' in $$props) $$invalidate(2, toggleHidden = $$props.toggleHidden);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('left' in $$props) $$invalidate(4, left = $$props.left);
    		if ('nodeColor' in $$props) $$invalidate(5, nodeColor = $$props.nodeColor);
    		if ('hideable' in $$props) $$invalidate(6, hideable = $$props.hideable);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		node,
    		hidden,
    		toggleHidden,
    		top,
    		left,
    		nodeColor,
    		hideable,
    		position,
    		dimensions,
    		bgColor,
    		borderRadius,
    		rotation,
    		width,
    		height,
    		color,
    		colorIsTransparent,
    		zIndex,
    		nodeRotation,
    		nodePosition,
    		$rotation,
    		$position,
    		$zIndex,
    		$borderRadius,
    		$bgColor,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ('node' in $$props) $$invalidate(0, node = $$props.node);
    		if ('hidden' in $$props) $$invalidate(1, hidden = $$props.hidden);
    		if ('toggleHidden' in $$props) $$invalidate(2, toggleHidden = $$props.toggleHidden);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('left' in $$props) $$invalidate(4, left = $$props.left);
    		if ('nodeColor' in $$props) $$invalidate(5, nodeColor = $$props.nodeColor);
    		if ('hideable' in $$props) $$invalidate(6, hideable = $$props.hideable);
    		if ('color' in $$props) $$invalidate(7, color = $$props.color);
    		if ('colorIsTransparent' in $$props) $$invalidate(8, colorIsTransparent = $$props.colorIsTransparent);
    		if ('zIndex' in $$props) $$subscribe_zIndex($$invalidate(9, zIndex = $$props.zIndex));
    		if ('nodeRotation' in $$props) $$invalidate(10, nodeRotation = $$props.nodeRotation);
    		if ('nodePosition' in $$props) $$invalidate(11, nodePosition = $$props.nodePosition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$position*/ 16777216) {
    			$$invalidate(11, nodePosition = $position);
    		}

    		if ($$self.$$.dirty & /*$rotation*/ 8388608) {
    			$$invalidate(10, nodeRotation = $rotation);
    		}

    		if ($$self.$$.dirty & /*node*/ 1) {
    			$$subscribe_zIndex($$invalidate(9, zIndex = node.zIndex));
    		}

    		if ($$self.$$.dirty & /*color*/ 128) {
    			$$invalidate(8, colorIsTransparent = color === "rgba(0, 0, 0, 0)");
    		}
    	};

    	return [
    		node,
    		hidden,
    		toggleHidden,
    		top,
    		left,
    		nodeColor,
    		hideable,
    		color,
    		colorIsTransparent,
    		zIndex,
    		nodeRotation,
    		nodePosition,
    		$zIndex,
    		$borderRadius,
    		$bgColor,
    		$width,
    		$height,
    		position,
    		bgColor,
    		borderRadius,
    		rotation,
    		width,
    		height,
    		$rotation,
    		$position,
    		click_handler
    	];
    }

    class MiniNode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			node: 0,
    			hidden: 1,
    			toggleHidden: 2,
    			top: 3,
    			left: 4,
    			nodeColor: 5,
    			hideable: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MiniNode",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get node() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set node(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleHidden() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleHidden(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nodeColor() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodeColor(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideable() {
    		throw new Error("<MiniNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideable(value) {
    		throw new Error("<MiniNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Minimap/MiniGroupBox.svelte generated by Svelte v3.58.0 */

    const file$4 = "node_modules/svelvet/dist/components/Minimap/MiniGroupBox.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let div_id_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "mini-bounding-box svelte-aoq4g");
    			attr_dev(div, "id", div_id_value = `mini-${/*groupName*/ ctx[2]}-bounding-box`);
    			set_style(div, "border", "solid 4px " + /*$color*/ ctx[8]);
    			set_style(div, "top", `${/*$position*/ ctx[5].y - /*top*/ ctx[3]}px`);
    			set_style(div, "left", `${/*$position*/ ctx[5].x - /*left*/ ctx[4]}px`);
    			set_style(div, "width", `${/*$width*/ ctx[6]}px`);
    			set_style(div, "height", `${/*$height*/ ctx[7]}px`);
    			set_style(div, "background-color", /*$color*/ ctx[8]);
    			add_location(div, file$4, 9, 0, 174);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*groupName*/ 4 && div_id_value !== (div_id_value = `mini-${/*groupName*/ ctx[2]}-bounding-box`)) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*$color*/ 256) {
    				set_style(div, "border", "solid 4px " + /*$color*/ ctx[8]);
    			}

    			const style_changed = dirty & /*$color*/ 256;

    			if (style_changed || dirty & /*$position, top, $color*/ 296) {
    				set_style(div, "top", `${/*$position*/ ctx[5].y - /*top*/ ctx[3]}px`);
    			}

    			if (style_changed || dirty & /*$position, left, $color*/ 304) {
    				set_style(div, "left", `${/*$position*/ ctx[5].x - /*left*/ ctx[4]}px`);
    			}

    			if (style_changed || dirty & /*$width, $color*/ 320) {
    				set_style(div, "width", `${/*$width*/ ctx[6]}px`);
    			}

    			if (style_changed || dirty & /*$height, $color*/ 384) {
    				set_style(div, "height", `${/*$height*/ ctx[7]}px`);
    			}

    			if (style_changed) {
    				set_style(div, "background-color", /*$color*/ ctx[8]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $position,
    		$$unsubscribe_position = noop,
    		$$subscribe_position = () => ($$unsubscribe_position(), $$unsubscribe_position = subscribe(position, $$value => $$invalidate(5, $position = $$value)), position);

    	let $width;
    	let $height;

    	let $color,
    		$$unsubscribe_color = noop,
    		$$subscribe_color = () => ($$unsubscribe_color(), $$unsubscribe_color = subscribe(color, $$value => $$invalidate(8, $color = $$value)), color);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_position());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_color());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MiniGroupBox', slots, []);
    	let { dimensions } = $$props;
    	let { position } = $$props;
    	validate_store(position, 'position');
    	$$subscribe_position();
    	let { color } = $$props;
    	validate_store(color, 'color');
    	$$subscribe_color();
    	let { groupName } = $$props;
    	let { top } = $$props;
    	let { left } = $$props;
    	const { width, height } = dimensions;
    	validate_store(width, 'width');
    	component_subscribe($$self, width, value => $$invalidate(6, $width = value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, value => $$invalidate(7, $height = value));

    	$$self.$$.on_mount.push(function () {
    		if (dimensions === undefined && !('dimensions' in $$props || $$self.$$.bound[$$self.$$.props['dimensions']])) {
    			console.warn("<MiniGroupBox> was created without expected prop 'dimensions'");
    		}

    		if (position === undefined && !('position' in $$props || $$self.$$.bound[$$self.$$.props['position']])) {
    			console.warn("<MiniGroupBox> was created without expected prop 'position'");
    		}

    		if (color === undefined && !('color' in $$props || $$self.$$.bound[$$self.$$.props['color']])) {
    			console.warn("<MiniGroupBox> was created without expected prop 'color'");
    		}

    		if (groupName === undefined && !('groupName' in $$props || $$self.$$.bound[$$self.$$.props['groupName']])) {
    			console.warn("<MiniGroupBox> was created without expected prop 'groupName'");
    		}

    		if (top === undefined && !('top' in $$props || $$self.$$.bound[$$self.$$.props['top']])) {
    			console.warn("<MiniGroupBox> was created without expected prop 'top'");
    		}

    		if (left === undefined && !('left' in $$props || $$self.$$.bound[$$self.$$.props['left']])) {
    			console.warn("<MiniGroupBox> was created without expected prop 'left'");
    		}
    	});

    	const writable_props = ['dimensions', 'position', 'color', 'groupName', 'top', 'left'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MiniGroupBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('dimensions' in $$props) $$invalidate(11, dimensions = $$props.dimensions);
    		if ('position' in $$props) $$subscribe_position($$invalidate(0, position = $$props.position));
    		if ('color' in $$props) $$subscribe_color($$invalidate(1, color = $$props.color));
    		if ('groupName' in $$props) $$invalidate(2, groupName = $$props.groupName);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('left' in $$props) $$invalidate(4, left = $$props.left);
    	};

    	$$self.$capture_state = () => ({
    		dimensions,
    		position,
    		color,
    		groupName,
    		top,
    		left,
    		width,
    		height,
    		$position,
    		$width,
    		$height,
    		$color
    	});

    	$$self.$inject_state = $$props => {
    		if ('dimensions' in $$props) $$invalidate(11, dimensions = $$props.dimensions);
    		if ('position' in $$props) $$subscribe_position($$invalidate(0, position = $$props.position));
    		if ('color' in $$props) $$subscribe_color($$invalidate(1, color = $$props.color));
    		if ('groupName' in $$props) $$invalidate(2, groupName = $$props.groupName);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('left' in $$props) $$invalidate(4, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		position,
    		color,
    		groupName,
    		top,
    		left,
    		$position,
    		$width,
    		$height,
    		$color,
    		width,
    		height,
    		dimensions
    	];
    }

    class MiniGroupBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			dimensions: 11,
    			position: 0,
    			color: 1,
    			groupName: 2,
    			top: 3,
    			left: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MiniGroupBox",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get dimensions() {
    		throw new Error("<MiniGroupBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dimensions(value) {
    		throw new Error("<MiniGroupBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<MiniGroupBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<MiniGroupBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<MiniGroupBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<MiniGroupBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupName() {
    		throw new Error("<MiniGroupBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupName(value) {
    		throw new Error("<MiniGroupBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<MiniGroupBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<MiniGroupBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<MiniGroupBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<MiniGroupBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelvet/dist/components/Minimap/Minimap.svelte generated by Svelte v3.58.0 */
    const file$3 = "node_modules/svelvet/dist/components/Minimap/Minimap.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[54] = list[i][0];
    	child_ctx[55] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[54] = list[i][0];
    	child_ctx[58] = list[i][1];
    	return child_ctx;
    }

    // (98:3) {#if node.id !== 'N-editor'}
    function create_if_block(ctx) {
    	let mininode;
    	let current;

    	mininode = new MiniNode({
    			props: {
    				node: /*node*/ ctx[58],
    				top: /*$top*/ ctx[11],
    				left: /*$left*/ ctx[10],
    				nodeColor: /*nodeColor*/ ctx[3],
    				hidden: /*$hidden*/ ctx[13].has(/*node*/ ctx[58]),
    				toggleHidden: /*toggleHidden*/ ctx[27],
    				hideable: /*hideable*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(mininode.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mininode, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const mininode_changes = {};
    			if (dirty[0] & /*$nodes*/ 16384) mininode_changes.node = /*node*/ ctx[58];
    			if (dirty[0] & /*$top*/ 2048) mininode_changes.top = /*$top*/ ctx[11];
    			if (dirty[0] & /*$left*/ 1024) mininode_changes.left = /*$left*/ ctx[10];
    			if (dirty[0] & /*nodeColor*/ 8) mininode_changes.nodeColor = /*nodeColor*/ ctx[3];
    			if (dirty[0] & /*$hidden, $nodes*/ 24576) mininode_changes.hidden = /*$hidden*/ ctx[13].has(/*node*/ ctx[58]);
    			if (dirty[0] & /*hideable*/ 64) mininode_changes.hideable = /*hideable*/ ctx[6];
    			mininode.$set(mininode_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mininode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mininode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mininode, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(98:3) {#if node.id !== 'N-editor'}",
    		ctx
    	});

    	return block;
    }

    // (97:2) {#each Array.from($nodes.entries()) as [id, node] (id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*node*/ ctx[58].id !== 'N-editor' && create_if_block(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*node*/ ctx[58].id !== 'N-editor') {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$nodes*/ 16384) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(97:2) {#each Array.from($nodes.entries()) as [id, node] (id)}",
    		ctx
    	});

    	return block;
    }

    // (111:2) {#each Array.from($groupBoxes.entries()) as [id, group] (id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let minigroupbox;
    	let current;

    	const minigroupbox_spread_levels = [
    		/*group*/ ctx[55],
    		{ top: /*$top*/ ctx[11] },
    		{ left: /*$left*/ ctx[10] },
    		{ groupName: /*id*/ ctx[54] }
    	];

    	let minigroupbox_props = {};

    	for (let i = 0; i < minigroupbox_spread_levels.length; i += 1) {
    		minigroupbox_props = assign(minigroupbox_props, minigroupbox_spread_levels[i]);
    	}

    	minigroupbox = new MiniGroupBox({
    			props: minigroupbox_props,
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(minigroupbox.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(minigroupbox, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const minigroupbox_changes = (dirty[0] & /*$groupBoxes, $top, $left*/ 35840)
    			? get_spread_update(minigroupbox_spread_levels, [
    					dirty[0] & /*$groupBoxes*/ 32768 && get_spread_object(/*group*/ ctx[55]),
    					dirty[0] & /*$top*/ 2048 && { top: /*$top*/ ctx[11] },
    					dirty[0] & /*$left*/ 1024 && { left: /*$left*/ ctx[10] },
    					dirty[0] & /*$groupBoxes*/ 32768 && { groupName: /*id*/ ctx[54] }
    				])
    			: {};

    			minigroupbox.$set(minigroupbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(minigroupbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(minigroupbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(minigroupbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(111:2) {#each Array.from($groupBoxes.entries()) as [id, group] (id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let style_width = `${/*boundsWidth*/ ctx[9]}px`;
    	let style_height = `${/*boundsHeight*/ ctx[8]}px`;
    	let style_transform = `scale(${/*boundsScale*/ ctx[7]})`;
    	let t1;
    	let div1;
    	let style_width_1 = `${/*width*/ ctx[0]}px`;
    	let style_height_1 = `${/*height*/ ctx[1] ? /*height*/ ctx[1] : /*width*/ ctx[0]}px`;
    	let current;
    	let each_value_1 = Array.from(/*$nodes*/ ctx[14].entries());
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*id*/ ctx[54];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
    	}

    	let each_value = Array.from(/*$groupBoxes*/ ctx[15].entries());
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*id*/ ctx[54];
    	validate_each_keys(ctx, each_value, get_each_context, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "node-wrapper svelte-1qxvbux");
    			set_style(div0, "width", style_width);
    			set_style(div0, "height", style_height);
    			set_style(div0, "transform", style_transform);
    			add_location(div0, file$3, 90, 1, 2548);
    			attr_dev(div1, "class", "overlay svelte-1qxvbux");
    			attr_dev(div1, "style", /*windowStyle*/ ctx[12]);
    			add_location(div1, file$3, 115, 1, 3102);
    			attr_dev(div2, "class", "minimap-wrapper svelte-1qxvbux");
    			toggle_class(div2, "SW", /*corner*/ ctx[5] === 'SW');
    			toggle_class(div2, "NE", /*corner*/ ctx[5] === 'NE');
    			toggle_class(div2, "SE", /*corner*/ ctx[5] === 'SE');
    			toggle_class(div2, "NW", /*corner*/ ctx[5] === 'NW');
    			set_style(div2, "width", style_width_1);
    			set_style(div2, "height", style_height_1);
    			set_style(div2, "--prop-minimap-border-color", /*borderColor*/ ctx[4]);
    			set_style(div2, "--prop-minimap-background-color", /*mapColor*/ ctx[2]);
    			add_location(div2, file$3, 79, 0, 2235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(div0, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$nodes, $top, $left, nodeColor, $hidden, toggleHidden, hideable*/ 134245448) {
    				each_value_1 = Array.from(/*$nodes*/ ctx[14].entries());
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div0, outro_and_destroy_block, create_each_block_1, t0, get_each_context_1);
    				check_outros();
    			}

    			if (dirty[0] & /*$groupBoxes, $top, $left*/ 35840) {
    				each_value = Array.from(/*$groupBoxes*/ ctx[15].entries());
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div0, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}

    			if (dirty[0] & /*boundsWidth*/ 512 && style_width !== (style_width = `${/*boundsWidth*/ ctx[9]}px`)) {
    				set_style(div0, "width", style_width);
    			}

    			if (dirty[0] & /*boundsHeight*/ 256 && style_height !== (style_height = `${/*boundsHeight*/ ctx[8]}px`)) {
    				set_style(div0, "height", style_height);
    			}

    			if (dirty[0] & /*boundsScale*/ 128 && style_transform !== (style_transform = `scale(${/*boundsScale*/ ctx[7]})`)) {
    				set_style(div0, "transform", style_transform);
    			}

    			if (!current || dirty[0] & /*windowStyle*/ 4096) {
    				attr_dev(div1, "style", /*windowStyle*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*corner*/ 32) {
    				toggle_class(div2, "SW", /*corner*/ ctx[5] === 'SW');
    			}

    			if (!current || dirty[0] & /*corner*/ 32) {
    				toggle_class(div2, "NE", /*corner*/ ctx[5] === 'NE');
    			}

    			if (!current || dirty[0] & /*corner*/ 32) {
    				toggle_class(div2, "SE", /*corner*/ ctx[5] === 'SE');
    			}

    			if (!current || dirty[0] & /*corner*/ 32) {
    				toggle_class(div2, "NW", /*corner*/ ctx[5] === 'NW');
    			}

    			if (dirty[0] & /*width*/ 1 && style_width_1 !== (style_width_1 = `${/*width*/ ctx[0]}px`)) {
    				set_style(div2, "width", style_width_1);
    			}

    			if (dirty[0] & /*height, width*/ 3 && style_height_1 !== (style_height_1 = `${/*height*/ ctx[1] ? /*height*/ ctx[1] : /*width*/ ctx[0]}px`)) {
    				set_style(div2, "height", style_height_1);
    			}

    			if (dirty[0] & /*borderColor*/ 16) {
    				set_style(div2, "--prop-minimap-border-color", /*borderColor*/ ctx[4]);
    			}

    			if (dirty[0] & /*mapColor*/ 4) {
    				set_style(div2, "--prop-minimap-background-color", /*mapColor*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const buffer = 0.9;

    function instance$4($$self, $$props, $$invalidate) {
    	let graphWidth;
    	let graphHeight;
    	let boundsWidth;
    	let boundsHeight;
    	let boundsRatio;
    	let minimapRatio;
    	let window;
    	let windowWidth;
    	let windowHeight;
    	let windowTop;
    	let windowLeft;
    	let windowStyle;
    	let landscape;
    	let boundsScale;
    	let windowLeftPx;
    	let windowTopPx;
    	let scaledBoundsWidth;
    	let scaledBoundsHeight;
    	let $hidden;
    	let $left;
    	let $top;
    	let $scale;
    	let $translation;
    	let $bottom;
    	let $right;
    	let $dimensions;
    	let $groups;
    	let $nodes;
    	let $groupBoxes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Minimap', slots, []);
    	let graph = getContext("graph");
    	let { width = 100 } = $$props;
    	let { height = width } = $$props;
    	let { mapColor = null } = $$props;
    	let { nodeColor = null } = $$props;
    	let { borderColor = null } = $$props;
    	let { corner = "SE" } = $$props;
    	let { hideable = false } = $$props;
    	const maxWidth = width * buffer;
    	const maxHeight = height * buffer;
    	const bounds = graph.bounds;
    	const top = bounds.top;
    	validate_store(top, 'top');
    	component_subscribe($$self, top, value => $$invalidate(11, $top = value));
    	const left = bounds.left;
    	validate_store(left, 'left');
    	component_subscribe($$self, left, value => $$invalidate(10, $left = value));
    	const bottom = bounds.bottom;
    	validate_store(bottom, 'bottom');
    	component_subscribe($$self, bottom, value => $$invalidate(44, $bottom = value));
    	const right = bounds.right;
    	validate_store(right, 'right');
    	component_subscribe($$self, right, value => $$invalidate(45, $right = value));
    	const nodes = graph.nodes;
    	validate_store(nodes, 'nodes');
    	component_subscribe($$self, nodes, value => $$invalidate(14, $nodes = value));
    	const groups = graph.groups;
    	validate_store(groups, 'groups');
    	component_subscribe($$self, groups, value => $$invalidate(47, $groups = value));
    	const transforms = graph.transforms;
    	const dimensions = graph.dimensions;
    	validate_store(dimensions, 'dimensions');
    	component_subscribe($$self, dimensions, value => $$invalidate(46, $dimensions = value));
    	const hidden = $groups.hidden.nodes;
    	validate_store(hidden, 'hidden');
    	component_subscribe($$self, hidden, value => $$invalidate(13, $hidden = value));
    	const scale = transforms.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(42, $scale = value));
    	const translation = transforms.translation;
    	validate_store(translation, 'translation');
    	component_subscribe($$self, translation, value => $$invalidate(43, $translation = value));
    	const groupBoxes = graph.groupBoxes;
    	validate_store(groupBoxes, 'groupBoxes');
    	component_subscribe($$self, groupBoxes, value => $$invalidate(15, $groupBoxes = value));
    	const e = { clientX: 0, clientY: 0 };

    	function toggleHidden(node) {
    		if ($hidden.has(node)) {
    			$hidden.delete(node);
    		} else {
    			$hidden.add(node);
    		}

    		hidden.set($hidden);
    	}

    	const writable_props = [
    		'width',
    		'height',
    		'mapColor',
    		'nodeColor',
    		'borderColor',
    		'corner',
    		'hideable'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Minimap> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('mapColor' in $$props) $$invalidate(2, mapColor = $$props.mapColor);
    		if ('nodeColor' in $$props) $$invalidate(3, nodeColor = $$props.nodeColor);
    		if ('borderColor' in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ('corner' in $$props) $$invalidate(5, corner = $$props.corner);
    		if ('hideable' in $$props) $$invalidate(6, hideable = $$props.hideable);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		MiniNode,
    		MiniGroupBox,
    		calculateRelativeCursor,
    		graph,
    		width,
    		height,
    		mapColor,
    		nodeColor,
    		borderColor,
    		corner,
    		hideable,
    		buffer,
    		maxWidth,
    		maxHeight,
    		bounds,
    		top,
    		left,
    		bottom,
    		right,
    		nodes,
    		groups,
    		transforms,
    		dimensions,
    		hidden,
    		scale,
    		translation,
    		groupBoxes,
    		e,
    		toggleHidden,
    		boundsScale,
    		boundsHeight,
    		scaledBoundsHeight,
    		boundsWidth,
    		scaledBoundsWidth,
    		windowTopPx,
    		windowLeftPx,
    		landscape,
    		minimapRatio,
    		boundsRatio,
    		windowHeight,
    		windowWidth,
    		windowLeft,
    		windowTop,
    		windowStyle,
    		window,
    		graphHeight,
    		graphWidth,
    		$hidden,
    		$left,
    		$top,
    		$scale,
    		$translation,
    		$bottom,
    		$right,
    		$dimensions,
    		$groups,
    		$nodes,
    		$groupBoxes
    	});

    	$$self.$inject_state = $$props => {
    		if ('graph' in $$props) graph = $$props.graph;
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('mapColor' in $$props) $$invalidate(2, mapColor = $$props.mapColor);
    		if ('nodeColor' in $$props) $$invalidate(3, nodeColor = $$props.nodeColor);
    		if ('borderColor' in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ('corner' in $$props) $$invalidate(5, corner = $$props.corner);
    		if ('hideable' in $$props) $$invalidate(6, hideable = $$props.hideable);
    		if ('boundsScale' in $$props) $$invalidate(7, boundsScale = $$props.boundsScale);
    		if ('boundsHeight' in $$props) $$invalidate(8, boundsHeight = $$props.boundsHeight);
    		if ('scaledBoundsHeight' in $$props) $$invalidate(28, scaledBoundsHeight = $$props.scaledBoundsHeight);
    		if ('boundsWidth' in $$props) $$invalidate(9, boundsWidth = $$props.boundsWidth);
    		if ('scaledBoundsWidth' in $$props) $$invalidate(29, scaledBoundsWidth = $$props.scaledBoundsWidth);
    		if ('windowTopPx' in $$props) $$invalidate(30, windowTopPx = $$props.windowTopPx);
    		if ('windowLeftPx' in $$props) $$invalidate(31, windowLeftPx = $$props.windowLeftPx);
    		if ('landscape' in $$props) $$invalidate(32, landscape = $$props.landscape);
    		if ('minimapRatio' in $$props) $$invalidate(33, minimapRatio = $$props.minimapRatio);
    		if ('boundsRatio' in $$props) $$invalidate(34, boundsRatio = $$props.boundsRatio);
    		if ('windowHeight' in $$props) $$invalidate(35, windowHeight = $$props.windowHeight);
    		if ('windowWidth' in $$props) $$invalidate(36, windowWidth = $$props.windowWidth);
    		if ('windowLeft' in $$props) $$invalidate(37, windowLeft = $$props.windowLeft);
    		if ('windowTop' in $$props) $$invalidate(38, windowTop = $$props.windowTop);
    		if ('windowStyle' in $$props) $$invalidate(12, windowStyle = $$props.windowStyle);
    		if ('window' in $$props) $$invalidate(39, window = $$props.window);
    		if ('graphHeight' in $$props) $$invalidate(40, graphHeight = $$props.graphHeight);
    		if ('graphWidth' in $$props) $$invalidate(41, graphWidth = $$props.graphWidth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$dimensions*/ 32768) {
    			$$invalidate(41, graphWidth = $dimensions.width);
    		}

    		if ($$self.$$.dirty[1] & /*$dimensions*/ 32768) {
    			$$invalidate(40, graphHeight = $dimensions.height);
    		}

    		if ($$self.$$.dirty[0] & /*$left*/ 1024 | $$self.$$.dirty[1] & /*$right*/ 16384) {
    			$$invalidate(9, boundsWidth = $right - $left);
    		}

    		if ($$self.$$.dirty[0] & /*$top*/ 2048 | $$self.$$.dirty[1] & /*$bottom*/ 8192) {
    			$$invalidate(8, boundsHeight = $bottom - $top);
    		}

    		if ($$self.$$.dirty[0] & /*boundsWidth, boundsHeight*/ 768) {
    			$$invalidate(34, boundsRatio = boundsWidth / boundsHeight);
    		}

    		if ($$self.$$.dirty[0] & /*width, height*/ 3) {
    			$$invalidate(33, minimapRatio = width / height);
    		}

    		if ($$self.$$.dirty[1] & /*graphWidth, graphHeight, $scale, $translation*/ 7680) {
    			$$invalidate(39, window = calculateRelativeCursor(e, 0, 0, graphWidth, graphHeight, $scale, $translation));
    		}

    		if ($$self.$$.dirty[0] & /*boundsWidth*/ 512 | $$self.$$.dirty[1] & /*graphWidth, $scale*/ 3072) {
    			$$invalidate(36, windowWidth = graphWidth / boundsWidth / $scale);
    		}

    		if ($$self.$$.dirty[0] & /*boundsHeight*/ 256 | $$self.$$.dirty[1] & /*graphHeight, $scale*/ 2560) {
    			$$invalidate(35, windowHeight = graphHeight / boundsHeight / $scale);
    		}

    		if ($$self.$$.dirty[0] & /*$top, boundsHeight*/ 2304 | $$self.$$.dirty[1] & /*window*/ 256) {
    			$$invalidate(38, windowTop = (window.y - $top) / boundsHeight);
    		}

    		if ($$self.$$.dirty[0] & /*$left, boundsWidth*/ 1536 | $$self.$$.dirty[1] & /*window*/ 256) {
    			$$invalidate(37, windowLeft = (window.x - $left) / boundsWidth);
    		}

    		if ($$self.$$.dirty[1] & /*boundsRatio, minimapRatio*/ 12) {
    			$$invalidate(32, landscape = boundsRatio >= minimapRatio);
    		}

    		if ($$self.$$.dirty[0] & /*boundsWidth, boundsHeight*/ 768 | $$self.$$.dirty[1] & /*landscape*/ 2) {
    			$$invalidate(7, boundsScale = landscape
    			? maxWidth / boundsWidth
    			: maxHeight / boundsHeight);
    		}

    		if ($$self.$$.dirty[0] & /*boundsHeight, boundsScale*/ 384) {
    			$$invalidate(28, scaledBoundsHeight = boundsHeight * boundsScale);
    		}

    		if ($$self.$$.dirty[0] & /*height, scaledBoundsHeight*/ 268435458) {
    			$$invalidate(30, windowTopPx = (height - scaledBoundsHeight) / 2);
    		}

    		if ($$self.$$.dirty[0] & /*boundsWidth, boundsScale*/ 640) {
    			$$invalidate(29, scaledBoundsWidth = boundsWidth * boundsScale);
    		}

    		if ($$self.$$.dirty[0] & /*width, scaledBoundsWidth*/ 536870913) {
    			$$invalidate(31, windowLeftPx = (width - scaledBoundsWidth) / 2);
    		}

    		if ($$self.$$.dirty[0] & /*windowTopPx, scaledBoundsHeight, scaledBoundsWidth*/ 1879048192 | $$self.$$.dirty[1] & /*windowTop, windowLeftPx, windowLeft, windowWidth, windowHeight*/ 241) {
    			$$invalidate(12, windowStyle = `
		top: ${windowTopPx + windowTop * scaledBoundsHeight}px;
		left: ${windowLeftPx + windowLeft * scaledBoundsWidth}px;
		width: ${windowWidth * scaledBoundsWidth}px;
		height: ${windowHeight * scaledBoundsHeight}px;`);
    		}
    	};

    	return [
    		width,
    		height,
    		mapColor,
    		nodeColor,
    		borderColor,
    		corner,
    		hideable,
    		boundsScale,
    		boundsHeight,
    		boundsWidth,
    		$left,
    		$top,
    		windowStyle,
    		$hidden,
    		$nodes,
    		$groupBoxes,
    		top,
    		left,
    		bottom,
    		right,
    		nodes,
    		groups,
    		dimensions,
    		hidden,
    		scale,
    		translation,
    		groupBoxes,
    		toggleHidden,
    		scaledBoundsHeight,
    		scaledBoundsWidth,
    		windowTopPx,
    		windowLeftPx,
    		landscape,
    		minimapRatio,
    		boundsRatio,
    		windowHeight,
    		windowWidth,
    		windowLeft,
    		windowTop,
    		window,
    		graphHeight,
    		graphWidth,
    		$scale,
    		$translation,
    		$bottom,
    		$right,
    		$dimensions
    	];
    }

    class Minimap extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				width: 0,
    				height: 1,
    				mapColor: 2,
    				nodeColor: 3,
    				borderColor: 4,
    				corner: 5,
    				hideable: 6
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Minimap",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get width() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mapColor() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mapColor(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nodeColor() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodeColor(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get corner() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set corner(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideable() {
    		throw new Error("<Minimap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideable(value) {
    		throw new Error("<Minimap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Minimap$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Minimap
    });

    /* node_modules/svelvet/dist/components/ThemeToggle/ThemeToggle.svelte generated by Svelte v3.58.0 */
    const file$2 = "node_modules/svelvet/dist/components/ThemeToggle/ThemeToggle.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let button;
    	let span;

    	let t_value = (/*current*/ ctx[6] === /*main*/ ctx[0]
    	? /*altIcon*/ ctx[2]
    	: /*mainIcon*/ ctx[1]) + "";

    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "material-symbols-outlined svelte-1nx22wk");
    			add_location(span, file$2, 32, 2, 1008);
    			attr_dev(button, "class", "svelte-1nx22wk");
    			add_location(button, file$2, 31, 1, 910);
    			attr_dev(div, "class", "controls-wrapper svelte-1nx22wk");
    			toggle_class(div, "SW", /*corner*/ ctx[3] === 'SW');
    			toggle_class(div, "NE", /*corner*/ ctx[3] === 'NE');
    			toggle_class(div, "SE", /*corner*/ ctx[3] === 'SE');
    			toggle_class(div, "NW", /*corner*/ ctx[3] === 'NW');
    			set_style(div, "--prop-theme-toggle-color", /*bgColor*/ ctx[4]);
    			set_style(div, "--prop-theme-toggle-text-color", /*iconColor*/ ctx[5]);
    			add_location(div, file$2, 22, 0, 671);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, span);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "mousedown", stop_propagation(/*toggleTheme*/ ctx[7]), false, false, true, false),
    					listen_dev(button, "touchstart", stop_propagation(/*toggleTheme*/ ctx[7]), { passive: true }, false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current, main, altIcon, mainIcon*/ 71 && t_value !== (t_value = (/*current*/ ctx[6] === /*main*/ ctx[0]
    			? /*altIcon*/ ctx[2]
    			: /*mainIcon*/ ctx[1]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*corner*/ 8) {
    				toggle_class(div, "SW", /*corner*/ ctx[3] === 'SW');
    			}

    			if (dirty & /*corner*/ 8) {
    				toggle_class(div, "NE", /*corner*/ ctx[3] === 'NE');
    			}

    			if (dirty & /*corner*/ 8) {
    				toggle_class(div, "SE", /*corner*/ ctx[3] === 'SE');
    			}

    			if (dirty & /*corner*/ 8) {
    				toggle_class(div, "NW", /*corner*/ ctx[3] === 'NW');
    			}

    			if (dirty & /*bgColor*/ 16) {
    				set_style(div, "--prop-theme-toggle-color", /*bgColor*/ ctx[4]);
    			}

    			if (dirty & /*iconColor*/ 32) {
    				set_style(div, "--prop-theme-toggle-text-color", /*iconColor*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ThemeToggle', slots, []);
    	let { main = "light" } = $$props;
    	let { alt = "dark" } = $$props;
    	let { mainIcon = "light_mode" } = $$props;
    	let { altIcon = "dark_mode" } = $$props;
    	let { corner = "NE" } = $$props;
    	let { bgColor = null } = $$props;
    	let { iconColor = null } = $$props;
    	let current = main;

    	function toggleTheme() {
    		const currentTheme = document.documentElement.getAttribute("svelvet-theme");
    		if (!currentTheme) return;
    		const newTheme = currentTheme === main ? alt : main;
    		$$invalidate(6, current = newTheme);
    		document.documentElement.setAttribute("svelvet-theme", currentTheme === main ? alt : main);
    	}

    	onMount(() => {
    		document.documentElement.setAttribute("svelvet-theme", main);
    	});

    	const writable_props = ['main', 'alt', 'mainIcon', 'altIcon', 'corner', 'bgColor', 'iconColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ThemeToggle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('alt' in $$props) $$invalidate(8, alt = $$props.alt);
    		if ('mainIcon' in $$props) $$invalidate(1, mainIcon = $$props.mainIcon);
    		if ('altIcon' in $$props) $$invalidate(2, altIcon = $$props.altIcon);
    		if ('corner' in $$props) $$invalidate(3, corner = $$props.corner);
    		if ('bgColor' in $$props) $$invalidate(4, bgColor = $$props.bgColor);
    		if ('iconColor' in $$props) $$invalidate(5, iconColor = $$props.iconColor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		main,
    		alt,
    		mainIcon,
    		altIcon,
    		corner,
    		bgColor,
    		iconColor,
    		current,
    		toggleTheme
    	});

    	$$self.$inject_state = $$props => {
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('alt' in $$props) $$invalidate(8, alt = $$props.alt);
    		if ('mainIcon' in $$props) $$invalidate(1, mainIcon = $$props.mainIcon);
    		if ('altIcon' in $$props) $$invalidate(2, altIcon = $$props.altIcon);
    		if ('corner' in $$props) $$invalidate(3, corner = $$props.corner);
    		if ('bgColor' in $$props) $$invalidate(4, bgColor = $$props.bgColor);
    		if ('iconColor' in $$props) $$invalidate(5, iconColor = $$props.iconColor);
    		if ('current' in $$props) $$invalidate(6, current = $$props.current);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [main, mainIcon, altIcon, corner, bgColor, iconColor, current, toggleTheme, alt];
    }

    class ThemeToggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			main: 0,
    			alt: 8,
    			mainIcon: 1,
    			altIcon: 2,
    			corner: 3,
    			bgColor: 4,
    			iconColor: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemeToggle",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get main() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set main(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alt() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mainIcon() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mainIcon(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get altIcon() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set altIcon(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get corner() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set corner(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconColor() {
    		throw new Error("<ThemeToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconColor(value) {
    		throw new Error("<ThemeToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ThemeToggle$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': ThemeToggle
    });

    /* src/frontend/components/Graph.svelte generated by Svelte v3.58.0 */

    // (6:0) <Svelvet id="my-canvas" zoom={0.5} minimap theme="custom-theme">
    function create_default_slot(ctx) {
    	let node;
    	let current;

    	node = new Node({
    			props: {
    				bgColor: "#ec4899",
    				height: 200,
    				position: { x: 100, y: 100 }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(node.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(node, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(node.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(node.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(node, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(6:0) <Svelvet id=\\\"my-canvas\\\" zoom={0.5} minimap theme=\\\"custom-theme\\\">",
    		ctx
    	});

    	return block;
    }

    // (8:1) 
    function create_toggle_slot(ctx) {
    	let themetoggle;
    	let current;

    	themetoggle = new ThemeToggle({
    			props: {
    				main: "custom-dark",
    				alt: "light",
    				slot: "toggle",
    				mainIcon: "light_mode"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(themetoggle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(themetoggle, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(themetoggle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(themetoggle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(themetoggle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_toggle_slot.name,
    		type: "slot",
    		source: "(8:1) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let svelvet;
    	let current;

    	svelvet = new Svelvet({
    			props: {
    				id: "my-canvas",
    				zoom: 0.5,
    				minimap: true,
    				theme: "custom-theme",
    				$$slots: {
    					toggle: [create_toggle_slot],
    					default: [create_default_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(svelvet.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(svelvet, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const svelvet_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				svelvet_changes.$$scope = { dirty, ctx };
    			}

    			svelvet.$set(svelvet_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svelvet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svelvet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(svelvet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Graph', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Graph> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Svelvet, ThemeToggle, Node, Background });
    	return [];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/frontend/components/PromptBox.svelte generated by Svelte v3.58.0 */

    const file$1 = "src/frontend/components/PromptBox.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let p;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Go";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Manifest your vision");
    			attr_dev(input, "class", "bg-transparent mr-auto ml-6 border-none text-gray-200 outline-none");
    			add_location(input, file$1, 4, 1, 117);
    			attr_dev(p, "class", "text-lg text-gray-200");
    			add_location(p, file$1, 6, 2, 362);
    			attr_dev(div0, "class", "rounded-full bg-zinc-500 hover:bg-zinc-600 w-16 h-8 ml-auto mr-2 flex justify-center items-center");
    			add_location(div0, file$1, 5, 1, 248);
    			attr_dev(div1, "class", "w-2/4 h-12 fixed bottom-10 bg-zinc-700 self-center rounded-full flex items-center");
    			add_location(div1, file$1, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PromptBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PromptBox> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class PromptBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PromptBox",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/frontend/App.svelte generated by Svelte v3.58.0 */
    const file = "src/frontend/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div5;
    	let div0;
    	let t0;
    	let div4;
    	let div1;
    	let p;
    	let t2;
    	let div3;
    	let div2;
    	let graph;
    	let t3;
    	let promptbox;
    	let current;
    	graph = new Graph({ $$inline: true });
    	promptbox = new PromptBox({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div5 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Toolbox";
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			create_component(graph.$$.fragment);
    			t3 = space();
    			create_component(promptbox.$$.fragment);
    			attr_dev(div0, "class", "h-14 bg-zinc-700 border-b-2 border-gray-500 flex items-center");
    			add_location(div0, file, 607, 6, 12945);
    			attr_dev(p, "class", "text-xl text-purple-400 pt-2");
    			add_location(p, file, 611, 12, 13178);
    			attr_dev(div1, "class", "w-48 grow-0 bg-zinc-700 border-r-2 border-gray-500 flex flex-col items-center");
    			add_location(div1, file, 610, 10, 13074);
    			attr_dev(div2, "class", "grow");
    			add_location(div2, file, 614, 12, 13302);
    			attr_dev(div3, "class", "flex flex-col grow");
    			add_location(div3, file, 613, 10, 13257);
    			attr_dev(div4, "class", "flex grow");
    			add_location(div4, file, 609, 6, 13040);
    			attr_dev(div5, "class", "flex flex-col h-screen");
    			add_location(div5, file, 606, 2, 12902);
    			add_location(main, file, 605, 0, 12893);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div5);
    			append_dev(div5, div0);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, p);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			mount_component(graph, div2, null);
    			append_dev(div3, t3);
    			mount_component(promptbox, div3, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graph.$$.fragment, local);
    			transition_in(promptbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graph.$$.fragment, local);
    			transition_out(promptbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(graph);
    			destroy_component(promptbox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Graph, PromptBox });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: "world",
        },
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
