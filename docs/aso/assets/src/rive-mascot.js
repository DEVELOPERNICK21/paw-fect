// Renders the app's real Rive mascot (src/shared/assets/rive/pawfect-puppy.riv) into canvas.mascot.
// Needs a static server rooted at the repo (paw-fect/) so /node_modules and /src resolve.
(function () {
  var c = document.querySelector('canvas.mascot');
  var s = document.createElement('script');
  s.src = '/node_modules/@rive-app/canvas/rive.js';
  s.onload = function () {
    var r = new rive.Rive({
      src: '/src/shared/assets/rive/pawfect-puppy.riv',
      canvas: c, autoplay: true, artboard: 'Mascot', stateMachines: 'Main',
      onLoad: function () { r.resizeDrawingSurfaceToCanvas(); document.title = 'loaded'; }
    });
  };
  document.head.appendChild(s);
})();
