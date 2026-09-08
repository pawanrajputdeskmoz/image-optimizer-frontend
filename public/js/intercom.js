/**
 * Intercom Messenger stub + widget loader.
 * App id is injected by IntercomBoot (window.__INTERCOM_APP_ID__).
 */
(function () {
  var w = window;
  var d = document;
  var appId = w.__INTERCOM_APP_ID__ || "zd1gh4in";

  if (typeof w.Intercom === "function") {
    return;
  }

  var i = function () {
    i.c(arguments);
  };
  i.q = [];
  i.c = function (args) {
    i.q.push(args);
  };
  w.Intercom = i;

  var s = d.createElement("script");
  s.type = "text/javascript";
  s.async = true;
  s.src = "https://widget.intercom.io/widget/" + appId;
  var x = d.getElementsByTagName("script")[0];
  if (x && x.parentNode) {
    x.parentNode.insertBefore(s, x);
  } else {
    d.head.appendChild(s);
  }
})();
