$(function() {
  var spelllist = $('.spelllist');
  function populateSpellList() {
    spelllist.find("tbody > tr").remove();
    $.each(spell_list, function(index, item) {
      var table_row = $('<tr>', {id: index, 'sp-class': Object.keys(item.class).join(',')});
      table_row.append($('<td>', {'class': 'sp-name col-sm-4', 'data-label': 'Name', html: item.name}),
                      $('<td>', {'class': 'sp-level col-sm-1', 'data-label': 'Level', html: item.level}),
                      $('<td>', {'class': 'sp-school col-sm-1', 'data-label': 'School', html: item.school}),
                      $('<td>', {'class': 'sp-ritual col-sm-1', 'data-label': 'Ritual', html: item.ritual.replace('no','-')}),
                      $('<td>', {'class': 'sp-casting-time col-sm-2', 'data-label': 'Casting Time', html: item.casting_time}),
                      $('<td>', {'class': 'sp-components col-sm-1', 'data-label': 'Components', html: item.components}),
                      $('<td>', {'class': 'sp-concentration col-sm-1', 'data-label': 'Concentration', html: item.concentration.replace('no','-')}),
                      $('<td>', {'class': 'sp-source col-sm-1', 'data-label': 'Source', html: item.page}));
      spelllist.append(table_row);
    });
    $(".spelllist > tbody > tr").on('click', rowClick);
  }

  // check if a elderbane was specified as a url parameter
  var searchParams = new URLSearchParams(window.location.search)
  var show_elderbane = false;
  if (searchParams.has('elderbane')) {
    show_elderbane = decodeURIComponent(searchParams.get('elderbane')) == "true";
  } else {      // url parameter overrides the cookie
    show_elderbane = Cookies.get('show_elderbane') == 'yes';
  }

  if (show_elderbane) {
    $('#elderbaneSlider').prop( "checked", true);
    spell_list = elderbane_spells;
  } else {
    $('#elderbaneSlider').prop( "checked", false);
    spell_list = original_spells;
  }
  populateSpellList();
  $('#elderbaneSlider').change(function() {
    if (this.checked) {
      show_elderbane = true;
      Cookies.set('show_elderbane', 'yes', { expires: 365 })
      spell_list = elderbane_spells;
    } else {
      show_elderbane = false;
      Cookies.remove('show_elderbane')
      spell_list = original_spells;
    }
    populateSpellList();
    filterSpells();
    // sort by the spell level twice to keep the same order
    $('.spelllist > thead > tr > th').eq(1).click();
    $('.spelllist > thead > tr > th').eq(1).click();
  });

  // add sorting to the spell list
  var levelStrings = {'Cantrip':0, '1st':1, '2nd':2, '3rd':3, '4th':4, '5th':5, '6th':6, '7th':7, '8th':8, '9th':9};
  function getCellValue(row, index) {
    var value = $(row).children('td').eq(index).text();
    return (typeof levelStrings[value] === 'undefined') ? value : levelStrings[value];
  }
  function comparer(index) {
    return function(a, b) {
      var valA = getCellValue(a, index), valB = getCellValue(b, index);
      var result = $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB);
      if (result == 0) {      // if values match, sort by level then name
        valA = getCellValue(a, 1);
        valB = getCellValue(b, 1);
        result = valA.toString().localeCompare(valB);
        if (result == 0) {
          valA = getCellValue(a, 0);
          valB = getCellValue(b, 0);
          result = valA.toString().localeCompare(valB);
        }
      }
      return result;
    }
  }
  $('.spelllist > thead > tr > th').click(function() {
    var table = $(this).parents('table').eq(0);
    var rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()));
    this.asc = !this.asc;
    if (!this.asc) {rows = rows.reverse()}
    for (var i = 0; i < rows.length; i++) {table.append(rows[i])}
  });
  $('.spelllist > thead > tr > th').eq(1).click();    // initially sort by the spell level

  // populate details when spell row is clicked
  function rowClick() {
    $("#detailName").text(spell_list[this.id].name);
    $("#detailLevelSchool").text(spell_list[this.id].level + ' ' + spell_list[this.id].school);
    var link = window.location.href.split('?')[0] + '?' +
        jQuery.param({ elderbane:show_elderbane, spell:encodeURIComponent(spell_list[this.id].name.toLowerCase()) });
    $("#directLink").attr("href", link);
    $("#clipboardItem").attr("href", link);
    $("#clipboardItem").text(spell_list[this.id].name);
    $("#detailCastingTime").text(spell_list[this.id].casting_time);
    $("#detailRange").text(spell_list[this.id].range);
    $("#detailDuration").text(spell_list[this.id].duration);
    $("#detailConcentration").text(spell_list[this.id].concentration);
    $("#detailComponents").text(spell_list[this.id].full_components);
    $("#detailRitual").text(spell_list[this.id].ritual);
    $("#detailClasses").text(Object.keys(spell_list[this.id].class).sort().join(', '));
    $("#detailDescription").html(spell_list[this.id].description);
    if (spell_list[this.id].creature) {
      $("#creatureNameBlock").html(spell_list[this.id].creature.name);
      $("#creatureAcHpBlock").html(spell_list[this.id].creature.ac_hp);
      $("#creatureAbilityBlock").html(spell_list[this.id].creature.abilities);
      $("#creatureSkillBlock").html(spell_list[this.id].creature.skills);
      if (spell_list[this.id].creature.features) {
        $("#creatureFeatureHolder").show();
        $("#creatureFeatureBlock").html(spell_list[this.id].creature.features);
      } else {
        $("#creatureFeatureHolder").hide();
      }
      if (spell_list[this.id].creature.actions) {
        $("#creatureActionHolder").show();
        $("#creatureActionBlock").html("<h4>Actions</h4>" + spell_list[this.id].creature.actions);
      } else {
        $("#creatureActionHolder").hide();
      }
      if (spell_list[this.id].creature.bonus_actions) {
        $("#creatureBonusActionHolder").show();
        $("#creatureBonusActionBlock").html("<h4>Bonus Actions</h4>" + spell_list[this.id].creature.bonus_actions);
      } else {
        $("#creatureBonusActionHolder").hide();
      }
      if (spell_list[this.id].creature.reactions) {
        $("#creatureReactionHolder").show();
        $("#creatureReactionBlock").html("<h4>Reactions</h4>" + spell_list[this.id].creature.reactions);
      } else {
        $("#creatureReactionHolder").hide();
      }
      $("#detailCreature").show();
    } else {
      $("#detailCreature").hide();
    }
    if ($("#detailContainer").is(":hidden")) {
      $('#detailContainer').slideDown();
    }
  }

  function copyToClip(htmlStr, plainStr) {
    // The newer API is here, but it sounds like Chrome doesn't support setting multiple formats through ClipboardItem yet:
    // navigator.clipboard.writeText(str);
    function listener(e) {
      e.clipboardData.setData("text/html", htmlStr);
      e.clipboardData.setData("text/plain", plainStr);
      e.preventDefault();
    }
    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
  };

  $("#directLink").click(function(event) {
    event.preventDefault();
    copyToClip(document.getElementById("clipboardItemHolder").innerHTML, $("#clipboardItem").attr("href"));
    var snackbar = document.getElementById("snackbar");
    snackbar.className = "show";
    setTimeout(function() { snackbar.className = snackbar.className.replace("show", ""); }, 1000);
  });

  var filterName = "";
  var filterExact = false;
  var filterClassList = [];
  var filterLevelList = [];
  var filterSchoolList = [];
  var filterRitualList = [];
  var filterCastingTimeList = [];
  var filterConcentrationList = [];
  var filterSourceList = [];

  // check if a spell was specified in a url parameter
  if (searchParams.has('spell')) {
    var decodedSpell = decodeURIComponent(searchParams.get('spell'));
    $('#searchName').text(decodedSpell);
    filterName = decodedSpell;
    filterExact = true;
  }

  // the filter is dramatically faster when each global is passed
  function filterSpellsInner(fName, fExact, fClass, fLevel, fSchool, fRitual, fCastingTime, fConcentration, fSource) {
    spelllist.find('tr:gt(0)').filter(function() { $(this).toggle(
      ((!fExact && $(this).children(".sp-name:first").text().toLowerCase().includes(fName)) || (fExact && $(this).children(".sp-name:first").text().toLowerCase() == fName)) &&
      (fClass.length == 0 || (fClass.filter(value => $(this).attr('sp-class').includes(value)).length > 0)) &&
      (fLevel.length == 0 || fLevel.indexOf($(this).children(".sp-level:first").text()) !== -1) &&
      (fSchool.length == 0 || fSchool.indexOf($(this).children(".sp-school:first").text()) !== -1) &&
      (fRitual.length == 0 || fRitual.indexOf($(this).children(".sp-ritual:first").text().replace('-','no')) !== -1) &&
      (fCastingTime.length == 0 || fCastingTime.indexOf($(this).children(".sp-casting-time:first").text()) !== -1) &&
      (fConcentration.length == 0 || fConcentration.indexOf($(this).children(".sp-concentration:first").text().replace('-','no')) !== -1) &&
      (fSource.length == 0 || (fSource.filter(value => $(this).children('.sp-source:first').text().includes(value)).length > 0))
    ); });

    var visibleList = spelllist.find('tr:gt(0):visible');
    if (visibleList.length == 0) {
      $('#detailContainer').slideUp();
    } else {
      visibleList.first().click();
    }
  }
  function filterSpells() {
    filterSpellsInner(filterName, filterExact, filterClassList, filterLevelList, filterSchoolList, filterRitualList, filterCastingTimeList, filterConcentrationList, filterSourceList);
  }

  function selectionListChanged(list, view) {
    $(view).html("");
    $.each(list, function(index, entry) {
      $("<p>" + entry + "</p>").on("click", function(e) {
        list.splice(list.indexOf($(this).text()), 1);
        selectionListChanged(list, view);
      }).css('cursor', 'pointer').appendTo(view);
    });

    filterSpells();
  }

  $("#selectClass").on('change', function() {
    if (this.value != "") {
      if (filterClassList.indexOf(this.value) === -1) {
        filterClassList.push(this.value);
        filterClassList.sort();
      }
      selectionListChanged(filterClassList, '#class_selected');
      this.value = "";
    }
  });
  $("#selectLevel").on('change', function() {
    if (this.value != "") {
      if (filterLevelList.indexOf(this.value) === -1) {
        filterLevelList.push(this.value);
        filterLevelList.sort(function(a,b) {  // need sort function so 'Cantrip' is before '1st'
          var aVal = levelStrings[a];
          var bVal = levelStrings[b];
          if (aVal < bVal) { return -1; }
          if (aVal > bVal) { return 1; }
          return 0;
        });
      }
      selectionListChanged(filterLevelList, '#level_selected');
      this.value = "";
    }
  });
  $("#selectSchool").on('change', function() {
    if (this.value != "") {
      if (filterSchoolList.indexOf(this.value) === -1) {
        filterSchoolList.push(this.value);
        filterSchoolList.sort();
      }
      selectionListChanged(filterSchoolList, '#school_selected');
      this.value = "";
    }
  });
  $("#selectRitual").on('change', function() {
    if (this.value != "") {
      if (filterRitualList.indexOf(this.value) === -1) {
        filterRitualList.push(this.value);
        filterRitualList.sort();
      }
      selectionListChanged(filterRitualList, '#ritual_selected');
      this.value = "";
    }
  });
  $("#selectCastingTime").on('change', function() {
    if (this.value != "") {
      if (filterCastingTimeList.indexOf(this.value) === -1) {
        filterCastingTimeList.push(this.value);
        filterCastingTimeList.sort();
      }
      selectionListChanged(filterCastingTimeList, '#casting_time_selected');
      this.value = "";
    }
  });
  $("#selectConcentration").on('change', function() {
    if (this.value != "") {
      if (filterConcentrationList.indexOf(this.value) === -1) {
        filterConcentrationList.push(this.value);
        filterConcentrationList.sort();
      }
      selectionListChanged(filterConcentrationList, '#concentration_selected');
      this.value = "";
    }
  });
  $("#selectSource").on('change', function() {
    if (this.value != "") {
      if (filterSourceList.indexOf(this.value) === -1) {
        filterSourceList.push(this.value);
        filterSourceList.sort();
      }
      selectionListChanged(filterSourceList, '#source_selected');
      this.value = "";
    }
  });

  $("#clearAll").on('click', function() {
    $(this).blur();               // make sure space doesn't activate the button again later
    $('#searchName').text('');
    filterClassList = [];
    $('#class_selected').html("");
    filterLevelList = [];
    $('#level_selected').html("");
    filterSchoolList = [];
    $('#school_selected').html("");
    filterRitualList = [];
    $('#ritual_selected').html("");
    filterCastingTimeList = [];
    $('#casting_time_selected').html("");
    filterConcentrationList = [];
    $('#concentration_selected').html("");
    filterSourceList = [];
    $('#source_selected').html("");
    filterSpells();
  });

  $(document).keydown(function(e) {
//    console.log("Key " + e.which);
    switch (e.which) {
      case 27: // ESC
        // don't call e.preventDefault() here so ESC will also cancel searches, etc.
        $('#searchName').text('');
        filterName = '';
        filterExact = false;
        filterSpells();
        break;
      case 8:  // backspace
      case 46: // del
        e.preventDefault();
        var searchName = $('#searchName');
        searchName.text(searchName.text().slice(0, -1));
        filterName = searchName.text();
        filterExact = false;
        filterSpells();
        break;
    }
  });
  $(document).keypress(function(e) {
    var key = String.fromCharCode(e.which).toLowerCase();
    if (key.match(/[a-z0-9 \-']/i)) {
      e.preventDefault();
      var searchName = $('#searchName');
      searchName.text(searchName.text() + key);
      filterName = searchName.text();
      filterExact = false;
      filterSpells();
    }
  });
  
  // remove the url parameters since they will quickly become out of sync with the search
  history.replaceState({}, '', window.location.pathname);

  filterSpells();
});
