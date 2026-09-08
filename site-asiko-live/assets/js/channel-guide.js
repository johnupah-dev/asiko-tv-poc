(function () {
  var grid = document.getElementById('channelGrid');
  var searchInput = document.getElementById('channelSearch');
  var filterBar = document.getElementById('filterBar');
  var resultCount = document.getElementById('resultCount');
  var emptyState = document.getElementById('emptyState');
  if (!grid) return;

  // The real 19 Asiko genre categories, in bouquet order.
  var CATEGORY_ORDER = [
    'Flagship',
    'Nollywood & Drama',
    'Faith',
    'News',
    'Business',
    'Comedy',
    'Beauty & Fashion',
    'Weddings',
    'Kiddies & Teens',
    'Music',
    'Culture & Heritage',
    "Women's Empowerment",
    'Community, Civic & Advocacy',
    'Lifestyle',
    'Shopping & Marketplace',
    'Travel & Tourism',
    'Sports',
    'General Entertainment & Talent',
    'Arts, Education & Skills'
  ];

  var STATUS_LABEL = {
    poc: 'Live on the POC',
    interested: 'Upcoming',
    queued: 'Onboarding'
  };

  var allChannels = [];
  var activeCategory = 'All';
  var activeQuery = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render() {
    var q = activeQuery.trim().toLowerCase();
    var list = allChannels.filter(function (c) {
      var inCat = activeCategory === 'All' || c.category === activeCategory;
      var hay = (c.name + ' ' + c.category + ' ' + (c.genreTag || '') + ' ' + (c.synopsis || '')).toLowerCase();
      var inSearch = !q || hay.indexOf(q) > -1;
      return inCat && inSearch;
    });

    grid.innerHTML = list.map(function (c) {
      var st = c.status || 'interested';
      return '' +
        '<div class="live-card ch-card ch-' + st + '" data-reveal>' +
          '<span class="upcoming-badge badge-' + st + '">' + (STATUS_LABEL[st] || 'Upcoming') + '</span>' +
          '<img src="' + esc(c.logo) + '" alt="' + esc(c.name) + ' logo" loading="lazy">' +
          '<div class="ch-name">' + esc(c.name) + '</div>' +
          '<div class="ch-cat">' + esc(c.genreTag || c.category) + '</div>' +
          (c.synopsis ? '<p class="ch-synopsis">' + esc(c.synopsis) + '</p>' : '') +
        '</div>';
    }).join('');

    var poc = list.filter(function (c) { return c.status === 'poc'; }).length;
    resultCount.textContent =
      list.length + (list.length === 1 ? ' channel' : ' channels') +
      (activeCategory !== 'All' ? ' in ' + activeCategory : '') +
      (q ? ' matching "' + activeQuery.trim() + '"' : '') +
      (poc ? ' · ' + poc + ' live on the POC now' : '');
    emptyState.style.display = list.length ? 'none' : 'block';
  }

  fetch('assets/js/channels-data.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      // keep bouquet order, but show POC-live channels first within the full list
      allChannels = data.slice().sort(function (a, b) {
        var rank = { poc: 0, interested: 1, queued: 2 };
        return (rank[a.status] || 1) - (rank[b.status] || 1);
      });

      var cats = ['All'].concat(CATEGORY_ORDER.filter(function (cat) {
        return allChannels.some(function (c) { return c.category === cat; });
      }));

      filterBar.innerHTML = cats.map(function (cat, i) {
        return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-cat="' + esc(cat) + '">' + esc(cat) + '</button>';
      }).join('');

      filterBar.querySelectorAll('.chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          filterBar.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          activeCategory = chip.getAttribute('data-cat');
          render();
        });
      });

      if (searchInput) {
        searchInput.addEventListener('input', function () {
          activeQuery = searchInput.value;
          render();
        });
      }

      render();
    })
    .catch(function () {
      grid.innerHTML = '<p style="color:var(--muted)">Channel guide is loading — please refresh.</p>';
    });
})();
