import { reactive, getCurrentInstance, toRef, isRef, inject, defineComponent, computed, ref, h, resolveComponent, shallowRef, unref, watchEffect, markRaw, defineAsyncComponent, provide, onErrorCaptured, useSSRContext, mergeProps, createApp } from "vue";
import { $fetch } from "ohmyfetch";
import { joinURL, hasProtocol, parseURL, isEqual, stringifyParsedURL, stringifyQuery, parseQuery } from "ufo";
import { useRuntimeConfig as useRuntimeConfig$1 } from "#internal/nitro";
import { createHooks } from "hookable";
import { getContext } from "unctx";
import "vue-router";
import "destr";
import { createError as createError$1, sendRedirect } from "h3";
import defu, { defuFn } from "defu";
import { isFunction } from "@vue/shared";
import { ssrRenderSuspense, ssrRenderComponent, ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
const buildAssetsDir = () => appConfig.buildAssetsDir;
const buildAssetsURL = (...path) => joinURL(publicAssetsURL(), buildAssetsDir(), ...path);
const publicAssetsURL = (...path) => {
  const publicBase = appConfig.cdnURL || appConfig.baseURL;
  return path.length ? joinURL(publicBase, ...path) : publicBase;
};
globalThis.__buildAssetsURL = buildAssetsURL;
globalThis.__publicAssetsURL = publicAssetsURL;
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  const nuxtApp = {
    provide: void 0,
    globalName: "nuxt",
    payload: reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    isHydrating: false,
    _asyncDataPromises: {},
    _asyncData: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a;
      if (prop === "public") {
        return target.public;
      }
      return (_a = target[prop]) != null ? _a : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return null;
    }
    if (plugin.length > 1) {
      return (nuxtApp) => plugin(nuxtApp, nuxtApp.provide);
    }
    return plugin;
  }).filter(Boolean);
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const nuxtAppInstance = nuxtAppCtx.tryUse();
  if (!nuxtAppInstance) {
    const vm = getCurrentInstance();
    if (!vm) {
      throw new Error("nuxt instance unavailable");
    }
    return vm.appContext.app.$nuxt;
  }
  return nuxtAppInstance;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = "$s" + _key;
  const nuxt = useNuxtApp();
  const state = toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (_err) => {
  const err = createError(_err);
  try {
    const nuxtApp = useNuxtApp();
    nuxtApp.callHook("app:error", err);
    const error = useError();
    error.value = error.value || err;
  } catch {
    throw err;
  }
  return err;
};
const clearError = async (options = {}) => {
  const nuxtApp = useNuxtApp();
  const error = useError();
  nuxtApp.callHook("app:error:cleared", options);
  if (options.redirect) {
    await nuxtApp.$router.replace(options.redirect);
  }
  error.value = null;
};
const createError = (err) => {
  const _err = createError$1(err);
  _err.__nuxt_error = true;
  return _err;
};
const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (getCurrentInstance()) {
    return inject("_route", useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : to.path || "/";
  const isExternal = hasProtocol(toPath, true);
  if (isExternal && !(options == null ? void 0 : options.external)) {
    throw new Error("Navigating to external URL is not allowed by default. Use `nagivateTo (url, { external: true })`.");
  }
  if (isExternal && parseURL(toPath).protocol === "script:") {
    throw new Error("Cannot navigate to an URL with script protocol.");
  }
  const router = useRouter();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = isExternal ? toPath : joinURL(useRuntimeConfig().app.baseURL, router.resolve(to).fullPath || "/");
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, (options == null ? void 0 : options.redirectCode) || 302));
    }
  }
  if (isExternal) {
    if (options == null ? void 0 : options.replace) {
      location.replace(toPath);
    } else {
      location.href = toPath;
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  return defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = computed(() => {
        return props.to || props.href || "";
      });
      const isExternal = computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      const prefetched = ref(false);
      return () => {
        var _a, _b, _c;
        if (!isExternal.value) {
          return h(
            resolveComponent("RouterLink"),
            {
              ref: void 0,
              to: to.value,
              ...prefetched.value && !props.custom ? { class: props.prefetchedClass || options.prefetchedClass } : {},
              activeClass: props.activeClass || options.activeClass,
              exactActiveClass: props.exactActiveClass || options.exactActiveClass,
              replace: props.replace,
              ariaCurrentValue: props.ariaCurrentValue,
              custom: props.custom
            },
            slots.default
          );
        }
        const href = typeof to.value === "object" ? (_b = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _b : null : to.value || null;
        const target = props.target || null;
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        const navigate = () => navigateTo(href, { replace: props.replace });
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href,
            navigate,
            route: router.resolve(href),
            rel,
            target,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0 = defineNuxtLink({ componentName: "NuxtLink" });
const inlineConfig = {};
defuFn(inlineConfig);
function useHead(meta) {
  const resolvedMeta = isFunction(meta) ? computed(meta) : meta;
  useNuxtApp()._useHead(resolvedMeta);
}
const components = {};
const _nuxt_components_plugin_mjs_KR1HBZs4kY = defineNuxtPlugin((nuxtApp) => {
  for (const name in components) {
    nuxtApp.vueApp.component(name, components[name]);
    nuxtApp.vueApp.component("Lazy" + name, components[name]);
  }
});
var PROVIDE_KEY = `usehead`;
var HEAD_COUNT_KEY = `head:count`;
var HEAD_ATTRS_KEY = `data-head-attrs`;
var SELF_CLOSING_TAGS = ["meta", "link", "base"];
var BODY_TAG_ATTR_NAME = `data-meta-body`;
var createElement = (tag, attrs, document) => {
  const el = document.createElement(tag);
  for (const key of Object.keys(attrs)) {
    if (key === "body" && attrs.body === true) {
      el.setAttribute(BODY_TAG_ATTR_NAME, "true");
    } else {
      let value = attrs[key];
      if (key === "renderPriority" || key === "key" || value === false) {
        continue;
      }
      if (key === "children") {
        el.textContent = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  return el;
};
var stringifyAttrName = (str) => str.replace(/[\s"'><\/=]/g, "").replace(/[^a-zA-Z0-9_-]/g, "");
var stringifyAttrValue = (str) => str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var stringifyAttrs = (attributes) => {
  const handledAttributes = [];
  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue;
    }
    if (value === false || value == null) {
      continue;
    }
    let attribute = stringifyAttrName(key);
    if (value !== true) {
      attribute += `="${stringifyAttrValue(String(value))}"`;
    }
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : "";
};
function isEqualNode(oldTag, newTag) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce");
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true);
      cloneTag.setAttribute("nonce", "");
      cloneTag.nonce = nonce;
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag);
    }
  }
  return oldTag.isEqualNode(newTag);
}
var tagDedupeKey = (tag) => {
  if (!["meta", "base", "script", "link"].includes(tag.tag)) {
    return false;
  }
  const { props, tag: tagName } = tag;
  if (tagName === "base") {
    return "base";
  }
  if (tagName === "link" && props.rel === "canonical") {
    return "canonical";
  }
  if (props.charset) {
    return "charset";
  }
  const name = ["key", "id", "name", "property", "http-equiv"];
  for (const n of name) {
    let value = void 0;
    if (typeof props.getAttribute === "function" && props.hasAttribute(n)) {
      value = props.getAttribute(n);
    } else {
      value = props[n];
    }
    if (value !== void 0) {
      return `${tagName}-${n}-${value}`;
    }
  }
  return false;
};
var acceptFields = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "noscript",
  "htmlAttrs",
  "bodyAttrs"
];
var renderTemplate = (template, title) => {
  if (template == null)
    return "";
  if (typeof template === "string") {
    return template.replace("%s", title != null ? title : "");
  }
  return template(unref(title));
};
var headObjToTags = (obj) => {
  const tags = [];
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (obj[key] == null)
      continue;
    switch (key) {
      case "title":
        tags.push({ tag: key, props: { children: obj[key] } });
        break;
      case "titleTemplate":
        break;
      case "base":
        tags.push({ tag: key, props: { key: "default", ...obj[key] } });
        break;
      default:
        if (acceptFields.includes(key)) {
          const value = obj[key];
          if (Array.isArray(value)) {
            value.forEach((item) => {
              tags.push({ tag: key, props: unref(item) });
            });
          } else if (value) {
            tags.push({ tag: key, props: value });
          }
        }
        break;
    }
  }
  return tags;
};
var setAttrs = (el, attrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY);
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key);
      }
    }
  }
  const keys = [];
  for (const key in attrs) {
    const value = attrs[key];
    if (value == null)
      continue;
    if (value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
    keys.push(key);
  }
  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","));
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY);
  }
};
var updateElements = (document = window.document, type, tags) => {
  var _a, _b;
  const head = document.head;
  const body = document.body;
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`);
  let bodyMetaElements = body.querySelectorAll(`[${BODY_TAG_ATTR_NAME}]`);
  const headCount = headCountEl ? Number(headCountEl.getAttribute("content")) : 0;
  const oldHeadElements = [];
  const oldBodyElements = [];
  if (bodyMetaElements) {
    for (let i = 0; i < bodyMetaElements.length; i++) {
      if (bodyMetaElements[i] && ((_a = bodyMetaElements[i].tagName) == null ? void 0 : _a.toLowerCase()) === type) {
        oldBodyElements.push(bodyMetaElements[i]);
      }
    }
  }
  if (headCountEl) {
    for (let i = 0, j = headCountEl.previousElementSibling; i < headCount; i++, j = (j == null ? void 0 : j.previousElementSibling) || null) {
      if (((_b = j == null ? void 0 : j.tagName) == null ? void 0 : _b.toLowerCase()) === type) {
        oldHeadElements.push(j);
      }
    }
  } else {
    headCountEl = document.createElement("meta");
    headCountEl.setAttribute("name", HEAD_COUNT_KEY);
    headCountEl.setAttribute("content", "0");
    head.append(headCountEl);
  }
  let newElements = tags.map((tag) => {
    var _a2;
    return {
      element: createElement(tag.tag, tag.props, document),
      body: (_a2 = tag.props.body) != null ? _a2 : false
    };
  });
  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldHeadElements.length; i++) {
      const oldEl = oldHeadElements[i];
      if (isEqualNode(oldEl, newEl.element)) {
        oldHeadElements.splice(i, 1);
        return false;
      }
    }
    for (let i = 0; i < oldBodyElements.length; i++) {
      const oldEl = oldBodyElements[i];
      if (isEqualNode(oldEl, newEl.element)) {
        oldBodyElements.splice(i, 1);
        return false;
      }
    }
    return true;
  });
  oldBodyElements.forEach((t) => {
    var _a2;
    return (_a2 = t.parentNode) == null ? void 0 : _a2.removeChild(t);
  });
  oldHeadElements.forEach((t) => {
    var _a2;
    return (_a2 = t.parentNode) == null ? void 0 : _a2.removeChild(t);
  });
  newElements.forEach((t) => {
    if (t.body === true) {
      body.insertAdjacentElement("beforeend", t.element);
    } else {
      head.insertBefore(t.element, headCountEl);
    }
  });
  headCountEl.setAttribute(
    "content",
    "" + (headCount - oldHeadElements.length + newElements.filter((t) => !t.body).length)
  );
};
var createHead = (initHeadObject) => {
  let allHeadObjs = [];
  let previousTags = /* @__PURE__ */ new Set();
  if (initHeadObject) {
    allHeadObjs.push(shallowRef(initHeadObject));
  }
  const head = {
    install(app) {
      app.config.globalProperties.$head = head;
      app.provide(PROVIDE_KEY, head);
    },
    get headTags() {
      const deduped = [];
      const deduping = {};
      const titleTemplate = allHeadObjs.map((i) => unref(i).titleTemplate).reverse().find((i) => i != null);
      allHeadObjs.forEach((objs, headObjectIdx) => {
        const tags = headObjToTags(unref(objs));
        tags.forEach((tag, tagIdx) => {
          tag._position = headObjectIdx * 1e4 + tagIdx;
          if (titleTemplate && tag.tag === "title") {
            tag.props.children = renderTemplate(
              titleTemplate,
              tag.props.children
            );
          }
          const dedupeKey = tagDedupeKey(tag);
          if (dedupeKey) {
            deduping[dedupeKey] = tag;
          } else {
            deduped.push(tag);
          }
        });
      });
      deduped.push(...Object.values(deduping));
      return deduped.sort((a, b) => a._position - b._position);
    },
    addHeadObjs(objs) {
      allHeadObjs.push(objs);
    },
    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs);
    },
    updateDOM(document = window.document) {
      let title;
      let htmlAttrs = {};
      let bodyAttrs = {};
      const actualTags = {};
      for (const tag of head.headTags.sort(sortTags)) {
        if (tag.tag === "title") {
          title = tag.props.children;
          continue;
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props);
          continue;
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props);
          continue;
        }
        actualTags[tag.tag] = actualTags[tag.tag] || [];
        actualTags[tag.tag].push(tag);
      }
      if (title !== void 0) {
        document.title = title;
      }
      setAttrs(document.documentElement, htmlAttrs);
      setAttrs(document.body, bodyAttrs);
      const tags = /* @__PURE__ */ new Set([...Object.keys(actualTags), ...previousTags]);
      for (const tag of tags) {
        updateElements(document, tag, actualTags[tag] || []);
      }
      previousTags.clear();
      Object.keys(actualTags).forEach((i) => previousTags.add(i));
    }
  };
  return head;
};
var tagToString = (tag) => {
  let isBodyTag = false;
  if (tag.props.body) {
    isBodyTag = true;
    delete tag.props.body;
  }
  if (tag.props.renderPriority) {
    delete tag.props.renderPriority;
  }
  let attrs = stringifyAttrs(tag.props);
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}${isBodyTag ? `  ${BODY_TAG_ATTR_NAME}="true"` : ""}>`;
  }
  return `<${tag.tag}${attrs}${isBodyTag ? ` ${BODY_TAG_ATTR_NAME}="true"` : ""}>${tag.props.children || ""}</${tag.tag}>`;
};
var sortTags = (aTag, bTag) => {
  const tagWeight = (tag) => {
    if (tag.props.renderPriority) {
      return tag.props.renderPriority;
    }
    switch (tag.tag) {
      case "base":
        return -1;
      case "meta":
        if (tag.props.charset) {
          return -2;
        }
        if (tag.props["http-equiv"] === "content-security-policy") {
          return 0;
        }
        return 10;
      default:
        return 10;
    }
  };
  return tagWeight(aTag) - tagWeight(bTag);
};
var renderHeadToString = (head) => {
  const tags = [];
  let titleTag = "";
  let htmlAttrs = {};
  let bodyAttrs = {};
  let bodyTags = [];
  for (const tag of head.headTags.sort(sortTags)) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag);
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props);
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props);
    } else if (tag.props.body) {
      bodyTags.push(tagToString(tag));
    } else {
      tags.push(tagToString(tag));
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`);
  return {
    get headTags() {
      return titleTag + tags.join("");
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(",")
      });
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(",")
      });
    },
    get bodyTags() {
      return bodyTags.join("");
    }
  };
};
const node_modules_nuxt_dist_head_runtime_lib_vueuse_head_plugin_mjs_D7WGfuP1A0 = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  nuxtApp.vueApp.use(head);
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    watchEffect(() => {
      head.updateDOM();
    });
  });
  nuxtApp._useHead = (_meta) => {
    const meta = ref(_meta);
    const headObj = computed(() => {
      const overrides = { meta: [] };
      if (meta.value.charset) {
        overrides.meta.push({ key: "charset", charset: meta.value.charset });
      }
      if (meta.value.viewport) {
        overrides.meta.push({ name: "viewport", content: meta.value.viewport });
      }
      return defu(overrides, meta.value);
    });
    head.addHeadObjs(headObj);
    {
      return;
    }
  };
  {
    nuxtApp.ssrContext.renderMeta = () => {
      const meta = renderHeadToString(head);
      return {
        ...meta,
        bodyScripts: meta.bodyTags
      };
    };
  }
});
const removeUndefinedProps = (props) => Object.fromEntries(Object.entries(props).filter(([, value]) => value !== void 0));
const setupForUseMeta = (metaFactory, renderChild) => (props, ctx) => {
  useHead(() => metaFactory({ ...removeUndefinedProps(props), ...ctx.attrs }, ctx));
  return () => {
    var _a, _b;
    return renderChild ? (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a) : null;
  };
};
const globalProps = {
  accesskey: String,
  autocapitalize: String,
  autofocus: {
    type: Boolean,
    default: void 0
  },
  class: String,
  contenteditable: {
    type: Boolean,
    default: void 0
  },
  contextmenu: String,
  dir: String,
  draggable: {
    type: Boolean,
    default: void 0
  },
  enterkeyhint: String,
  exportparts: String,
  hidden: {
    type: Boolean,
    default: void 0
  },
  id: String,
  inputmode: String,
  is: String,
  itemid: String,
  itemprop: String,
  itemref: String,
  itemscope: String,
  itemtype: String,
  lang: String,
  nonce: String,
  part: String,
  slot: String,
  spellcheck: {
    type: Boolean,
    default: void 0
  },
  style: String,
  tabindex: String,
  title: String,
  translate: String
};
const Script = defineComponent({
  name: "Script",
  inheritAttrs: false,
  props: {
    ...globalProps,
    async: Boolean,
    crossorigin: {
      type: [Boolean, String],
      default: void 0
    },
    defer: Boolean,
    fetchpriority: String,
    integrity: String,
    nomodule: Boolean,
    nonce: String,
    referrerpolicy: String,
    src: String,
    type: String,
    charset: String,
    language: String
  },
  setup: setupForUseMeta((script) => ({
    script: [script]
  }))
});
const NoScript = defineComponent({
  name: "NoScript",
  inheritAttrs: false,
  props: {
    ...globalProps,
    title: String
  },
  setup: setupForUseMeta((props, { slots }) => {
    var _a;
    const noscript = { ...props };
    const textContent = (((_a = slots.default) == null ? void 0 : _a.call(slots)) || []).filter(({ children }) => children).map(({ children }) => children).join("");
    if (textContent) {
      noscript.children = textContent;
    }
    return {
      noscript: [noscript]
    };
  })
});
const Link = defineComponent({
  name: "Link",
  inheritAttrs: false,
  props: {
    ...globalProps,
    as: String,
    crossorigin: String,
    disabled: Boolean,
    fetchpriority: String,
    href: String,
    hreflang: String,
    imagesizes: String,
    imagesrcset: String,
    integrity: String,
    media: String,
    prefetch: {
      type: Boolean,
      default: void 0
    },
    referrerpolicy: String,
    rel: String,
    sizes: String,
    title: String,
    type: String,
    methods: String,
    target: String
  },
  setup: setupForUseMeta((link) => ({
    link: [link]
  }))
});
const Base = defineComponent({
  name: "Base",
  inheritAttrs: false,
  props: {
    ...globalProps,
    href: String,
    target: String
  },
  setup: setupForUseMeta((base) => ({
    base
  }))
});
const Title = defineComponent({
  name: "Title",
  inheritAttrs: false,
  setup: setupForUseMeta((_, { slots }) => {
    var _a, _b, _c;
    const title = ((_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children) || null;
    return {
      title
    };
  })
});
const Meta = defineComponent({
  name: "Meta",
  inheritAttrs: false,
  props: {
    ...globalProps,
    charset: String,
    content: String,
    httpEquiv: String,
    name: String
  },
  setup: setupForUseMeta((props) => {
    const meta = { ...props };
    if (meta.httpEquiv) {
      meta["http-equiv"] = meta.httpEquiv;
      delete meta.httpEquiv;
    }
    return {
      meta: [meta]
    };
  })
});
const Style = defineComponent({
  name: "Style",
  inheritAttrs: false,
  props: {
    ...globalProps,
    type: String,
    media: String,
    nonce: String,
    title: String,
    scoped: {
      type: Boolean,
      default: void 0
    }
  },
  setup: setupForUseMeta((props, { slots }) => {
    var _a, _b, _c;
    const style = { ...props };
    const textContent = (_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children;
    if (textContent) {
      style.children = textContent;
    }
    return {
      style: [style]
    };
  })
});
const Head = defineComponent({
  name: "Head",
  inheritAttrs: false,
  setup: (_props, ctx) => () => {
    var _a, _b;
    return (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a);
  }
});
const Html = defineComponent({
  name: "Html",
  inheritAttrs: false,
  props: {
    ...globalProps,
    manifest: String,
    version: String,
    xmlns: String
  },
  setup: setupForUseMeta((htmlAttrs) => ({ htmlAttrs }), true)
});
const Body = defineComponent({
  name: "Body",
  inheritAttrs: false,
  props: globalProps,
  setup: setupForUseMeta((bodyAttrs) => ({ bodyAttrs }), true)
});
const Components = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Script,
  NoScript,
  Link,
  Base,
  Title,
  Meta,
  Style,
  Head,
  Html,
  Body
}, Symbol.toStringTag, { value: "Module" }));
const appHead = { "meta": [], "link": [], "style": [], "script": [], "noscript": [], "charset": "utf-8", "viewport": "width=device-width, initial-scale=1" };
const metaMixin = {
  created() {
    const instance = getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
const node_modules_nuxt_dist_head_runtime_plugin_mjs_1QO0gqa6n2 = defineNuxtPlugin((nuxtApp) => {
  useHead(markRaw({ title: "", ...appHead }));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name in Components) {
    nuxtApp.vueApp.component(name, Components[name]);
  }
});
const globalMiddleware = [];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = parseURL(fullPath.toString());
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const node_modules_nuxt_dist_app_plugins_router_mjs_PJLmOmdFeM = defineNuxtPlugin((nuxtApp) => {
  const initialURL = nuxtApp.ssrContext.url;
  const routes = [];
  const hooks = {
    "navigate:before": [],
    "resolve:before": [],
    "navigate:after": [],
    error: []
  };
  const registerHook = (hook, guard) => {
    hooks[hook].push(guard);
    return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
  };
  const baseURL2 = useRuntimeConfig().app.baseURL;
  const route = reactive(getRouteFromPath(initialURL));
  async function handleNavigation(url, replace) {
    try {
      const to = getRouteFromPath(url);
      for (const middleware of hooks["navigate:before"]) {
        const result = await middleware(to, route);
        if (result === false || result instanceof Error) {
          return;
        }
        if (result) {
          return handleNavigation(result, true);
        }
      }
      for (const handler of hooks["resolve:before"]) {
        await handler(to, route);
      }
      Object.assign(route, to);
      if (false)
        ;
      for (const middleware of hooks["navigate:after"]) {
        await middleware(to, route);
      }
    } catch (err) {
      for (const handler of hooks.error) {
        await handler(err);
      }
    }
  }
  const router = {
    currentRoute: route,
    isReady: () => Promise.resolve(),
    options: {},
    install: () => Promise.resolve(),
    push: (url) => handleNavigation(url, false),
    replace: (url) => handleNavigation(url, true),
    back: () => window.history.go(-1),
    go: (delta) => window.history.go(delta),
    forward: () => window.history.go(1),
    beforeResolve: (guard) => registerHook("resolve:before", guard),
    beforeEach: (guard) => registerHook("navigate:before", guard),
    afterEach: (guard) => registerHook("navigate:after", guard),
    onError: (handler) => registerHook("error", handler),
    resolve: getRouteFromPath,
    addRoute: (parentName, route2) => {
      routes.push(route2);
    },
    getRoutes: () => routes,
    hasRoute: (name) => routes.some((route2) => route2.name === name),
    removeRoute: (name) => {
      const index = routes.findIndex((route2) => route2.name === name);
      if (index !== -1) {
        routes.splice(index, 1);
      }
    }
  };
  nuxtApp.vueApp.component("RouterLink", {
    functional: true,
    props: {
      to: String,
      custom: Boolean,
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      ariaCurrentValue: String
    },
    setup: (props, { slots }) => {
      const navigate = () => handleNavigation(props.to, props.replace);
      return () => {
        var _a;
        const route2 = router.resolve(props.to);
        return props.custom ? (_a = slots.default) == null ? void 0 : _a.call(slots, { href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
          e.preventDefault();
          return navigate();
        } }, slots);
      };
    }
  });
  nuxtApp._route = route;
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  const initialLayout = useState("_layout");
  nuxtApp.hooks.hookOnce("app:created", async () => {
    router.beforeEach(async (to, from) => {
      var _a;
      to.meta = reactive(to.meta || {});
      if (nuxtApp.isHydrating) {
        to.meta.layout = (_a = initialLayout.value) != null ? _a : to.meta.layout;
      }
      nuxtApp._processingMiddleware = true;
      const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
      for (const middleware of middlewareEntries) {
        const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
        {
          if (result === false || result instanceof Error) {
            const error = result || createError$1({
              statusMessage: `Route navigation aborted: ${initialURL}`
            });
            return callWithNuxt(nuxtApp, showError, [error]);
          }
        }
        if (result || result === false) {
          return result;
        }
      }
    });
    router.afterEach(() => {
      delete nuxtApp._processingMiddleware;
    });
    await router.replace(initialURL);
    if (!isEqual(route.fullPath, initialURL)) {
      await callWithNuxt(nuxtApp, navigateTo, [route.fullPath]);
    }
  });
  return {
    provide: {
      route,
      router
    }
  };
});
const _plugins = [
  _nuxt_components_plugin_mjs_KR1HBZs4kY,
  node_modules_nuxt_dist_head_runtime_lib_vueuse_head_plugin_mjs_D7WGfuP1A0,
  node_modules_nuxt_dist_head_runtime_plugin_mjs_1QO0gqa6n2,
  node_modules_nuxt_dist_app_plugins_router_mjs_PJLmOmdFeM
];
const _sfc_main$2 = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const ErrorComponent = defineAsyncComponent(() => import("./_nuxt/error-component.7e8b6be2.js").then((r) => r.default || r));
    const nuxtApp = useNuxtApp();
    provide("_route", useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        callWithNuxt(nuxtApp, showError, [err]);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_App = resolveComponent("App");
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else {
            _push(ssrRenderComponent(_component_App, null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const Card_vue_vue_type_style_index_0_lang = "";
const _sfc_main$1 = {
  __name: "Card",
  __ssrInlineRender: true,
  props: ["song", "rank"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "card" }, _attrs))}><img${ssrRenderAttr("src", __props.song.cover)}${ssrRenderAttr("alt", __props.song.title)}><div class="rank">${ssrInterpolate(__props.rank)}</div><p class="title">${ssrInterpolate(__props.song.title.toLowerCase())}</p><p class="artist">${ssrInterpolate(__props.song.artist)}</p></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const app_vue_vue_type_style_index_0_lang = "";
const _sfc_main = {
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const data = [
      {
        title: "UNHOLY",
        artist: "Sam Smith And Kim Petras",
        cover: "./data/images/cover_0_1663965857.jpg"
      },
      {
        title: "UNDER THE INFLUENCE",
        artist: "Chris Brown",
        cover: "./data/images/cover_0_1660872949.jpg"
      },
      {
        title: "SUPER FREAKY GIRL",
        artist: "Nicki Minaj",
        cover: "./data/images/cover_25_1660785693.jpg"
      },
      {
        title: "I'M GOOD (BLUE)",
        artist: "David Guetta And Bebe Rexha",
        cover: "./data/images/cover_10_1662000846.jpg"
      },
      {
        title: "I AIN'T WORRIED",
        artist: "OneRepublic",
        cover: "./data/images/cover_9_1653007613.jpg"
      },
      {
        title: "CUFF IT",
        artist: "Beyonce",
        cover: "./data/images/cover_10_1659566329.jpg"
      },
      {
        title: "DOJA",
        artist: "Central Cee",
        cover: "./data/images/cover_9_1658962912.jpg"
      },
      {
        title: "BAD HABIT",
        artist: "Steve Lacy",
        cover: "./data/images/cover_1_1657157286.jpg"
      },
      {
        title: "B.O.T.A. (BADDEST OF THEM ALL)",
        artist: "Eliza Rose And Interplanetary Criminal",
        cover: "./data/images/cover_0_1660785693.jpg"
      },
      {
        title: "AS IT WAS",
        artist: "Harry Styles",
        cover: "./data/images/cover_1_1649296712.jpg"
      },
      {
        title: "BIG CITY LIFE",
        artist: "Luude And Mattafix",
        cover: "./data/images/cover_0_1655502615.jpg"
      },
      {
        title: "EVERGREEN (YOU DIDN'T DESERVE ME AT ALL)",
        artist: "Omar Apollo",
        cover: "./data/images/cover_6_1663203663.jpg"
      },
      {
        title: "HEAT WAVES",
        artist: "Glass Animals",
        cover: "./data/images/cover_0_1612507900.jpg"
      },
      {
        title: "COLD HEART (PNAU REMIX)",
        artist: "Elton John And Dua Lipa",
        cover: "./data/images/cover_2_1629343631.jpg"
      },
      {
        title: "GANGSTA'S PARADISE",
        artist: "Coolio feat. LV",
        cover: "./data/images/cover_11_1665016991.jpg"
      },
      {
        title: "LAST LAST",
        artist: "Burna Boy",
        cover: "./data/images/cover_14_1653007613.jpg"
      },
      {
        title: "VEGAS",
        artist: "Doja Cat",
        cover: "./data/images/cover_34_1652307978.jpg"
      },
      {
        title: "GO (GODDARD. REMIX)",
        artist: "Cat Burns",
        cover: "./data/images/cover_6_1648688496.jpg"
      },
      {
        title: "SUNROOF",
        artist: "Nicky Youre And dazy",
        cover: "./data/images/cover_4_1656025971.jpg"
      },
      {
        title: "I LIKE YOU (A HAPPIER SONG)",
        artist: "Post Malone And Doja Cat",
        cover: "./data/images/cover_3_1654738000.jpg"
      },
      {
        title: "ABOUT DAMN TIME",
        artist: "Lizzo",
        cover: "./data/images/cover_0_1650504543.jpg"
      },
      {
        title: "BEFORE YOU LEAVE",
        artist: "Six60",
        cover: "./data/images/cover_2_1661380817.jpg"
      },
      {
        title: "ROMANTIC HOMICIDE",
        artist: "d4vd",
        cover: "./data/images/cover_1_1663888964.jpg"
      },
      {
        title: "GLIMPSE OF US",
        artist: "Joji",
        cover: "./data/images/cover_13_1655343256.jpg"
      },
      {
        title: "SHIVERS",
        artist: "Ed Sheeran",
        cover: "./data/images/cover_0_1631751037.jpg"
      },
      {
        title: "DREAMS",
        artist: "Fleetwood Mac",
        cover: "./data/images/cover_0_1602539083.jpg"
      },
      {
        title: "WAIT FOR U",
        artist: "Future feat. Drake And Tems",
        cover: "./data/images/cover_6_1651704933.jpg"
      },
      {
        title: "NO ROLE MODELZ",
        artist: "J. Cole",
        cover: "./data/images/cover_12_1648160774.jpg"
      },
      {
        title: "HOLD ME CLOSER",
        artist: "Elton John And Britney Spears",
        cover: "./data/images/cover_8_1662000846.jpg"
      },
      {
        title: "FORGET ME",
        artist: "Lewis Capaldi",
        cover: "./data/images/cover_7_1663203663.jpg"
      },
      {
        title: "SNAP",
        artist: "Rosa Linn",
        cover: "./data/images/cover_0_1658365536.jpg"
      },
      {
        title: "BAD HABITS",
        artist: "Ed Sheeran",
        cover: "./data/images/cover_3_1625094334.jpg"
      },
      {
        title: "2 BE LOVED (AM I READY)",
        artist: "Lizzo",
        cover: "./data/images/cover_0_1658364778.jpg"
      },
      {
        title: "ANOTHER LOVE",
        artist: "Tom Odell",
        cover: "./data/images/cover_0_1662099180.jpg"
      },
      {
        title: "SWEATER WEATHER",
        artist: "The Neighbourhood",
        cover: "./data/images/cover_0_1660271268.jpg"
      },
      {
        title: "FIRST CLASS",
        artist: "Jack Harlow",
        cover: "./data/images/cover_11_1649888698.jpg"
      },
      {
        title: "JIMMY COOKS",
        artist: "Drake feat. 21 Savage",
        cover: "./data/images/cover_10_1655936924.jpg"
      },
      {
        title: "STAY",
        artist: "The Kid LAROI And Justin Bieber",
        cover: "./data/images/cover_24_1626311474.jpg"
      },
      {
        title: "STAR WALKIN'",
        artist: "Lil Nas X",
        cover: "./data/images/cover_29_1664400652.jpg"
      },
      {
        title: "SHUT DOWN",
        artist: "BLACKPINK",
        cover: "./data/images/cover_11_1663797634.jpg"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Card = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "wrapper" }, _attrs))}><h1 class="full-width">New Zealand Top 40</h1><div class="flex"><!--[-->`);
      ssrRenderList(data, (song, index) => {
        _push(ssrRenderComponent(_component_Card, {
          song,
          rank: index + 1
        }, null, _parent));
      });
      _push(`<!--]--></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
const plugins = normalizePlugins(_plugins);
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main$2);
    vueApp.component("App", _sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.callHook("app:error", err);
      nuxt.payload.error = nuxt.payload.error || err;
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);
export {
  __nuxt_component_0 as _,
  entry$1 as default,
  useHead as u
};
//# sourceMappingURL=server.mjs.map
