/* Public Tizen application APIs. No Mac server, network address or credentials. */
(function () {
  'use strict';
  var IDS = {
    netflix: 'RN1MCdNq8t.Netflix', videoland: 'WyN2wsAQHK.VideolandV2',
    youtube: '9Ur5IzDKqV.TizenYouTube', tizentube: 'xvvl3S1bvH.TizenBrewStandalone',
    disneyplus: 'MCmYXNxgcu.DisneyPlus', npostart: 'iquaePhaki.npostart',
    jellyfin: 'AprZAARz4r.Jellyfin', odidotv: 'OyP0deWouM.SamsungSmartTV'
  };
  var STREAMING = ['ESMP8SBFDH.videoland', 'iquaePhaki.npostart', 'kOzIRC5Wf7.NLziet', 'azFWqejcXJ.NLZiet', 'dkEzA1pxuO.RTLXL', '8H24TM2DAH.kijk',
    'evKhCgZelL.AmazonIgnitionLauncher2', 'skysh0WTIM.SkyShowtime', 'xf4VNjoz7A.SmartTVNextGen', 'fjZ4l75rVu.EVA', 'rJeHak5zRg.Spotify', 'com.samsung.tv.aria-video'];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.microsoft.copilot'];
  var EXTRA_BRANDS = {'rJeHak5zRg.Spotify': 'spotify'};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', '25emanual3.emanual',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'BuijsHome1.TvStart';
  function api() { return window.tizen && window.tizen.application; }
  function unavailable(done) {
    done({ message: 'Open het startscherm op de tv om dit te gebruiken.', detail: 'De preview in de browser kan de tv niet bedienen.' });
  }
  function failure(err) {
    return { message: 'De tv kon dit scherm niet openen.', detail: err && (err.message || err.name) || 'Probeer het opnieuw, of druk op de Home-knop van de afstandsbediening.' };
  }
  function bounded(done) {
    var finished = false, timer = setTimeout(function () { finish({ message: 'De tv reageerde niet. Probeer het opnieuw.' }); }, 8000);
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    return finish;
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try { api().launch(id, function () { finish(null); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({message: 'Deze app kan niet gestart worden.'}); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function home(done) { launchApp('com.samsung.tv.csfs', done); }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      api().getAppsInfo(function (list) {
        var known = {}, seen = {}, result = [];
        Object.keys(IDS).forEach(function (brand) { known[IDS[brand]] = brand; });
        list.forEach(function (a) {
          var primary = !!known[a.id], stream = STREAMING.indexOf(a.id) >= 0;
          var consumer = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/.test(a.id) || CONSUMER_SYSTEM.indexOf(a.id) >= 0;
          if (a.id === SELF || INTERNAL.indexOf(a.id) >= 0 || seen[a.id] || !a.name || (!primary && !stream && (!a.show || !consumer))) return;
          if (!primary && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
          if (/-dummy$/.test(a.id) || a.id === 'com.samsung.tv.cobalt-yt') return;
          seen[a.id] = true;
          result.push({ appId: a.id, name: a.name, brand: known[a.id] || EXTRA_BRANDS[a.id] || '', icon: a.iconPath || '', rank: primary ? Object.keys(IDS).indexOf(known[a.id]) : (stream ? 20 : 30) });
        });
        result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
        finish(null, result);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  window.FrameDevice = { launch: launch, launchApp: launchApp, art: art, home: home, settings: settings, apps: apps };
}());
