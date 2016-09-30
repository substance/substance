# Clipboard HTML

Documenting the diversity of HTML received from the Clipboard.
Not only, that there platform specific differences, also every application
does their own thing. Web-Apps like Google Docs add diversity by creating different content in different browsers.

To make our ClipboardImporter as robust as possible, we perform a series of
normalization steps.

## Browser / Chrome (Linux / OSX)

The only difference between Linux and OSX is the `meta` tag:

Linux:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8">
```

OSX:

```
<meta charset='utf-8'>
```

### Plain Text:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><span style="color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 22.3999996185303px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);">Obama received national<span class="Apple-converted-space"> </span></span>
```

### Annotated Text:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><span style="color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 22.3999996185303px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);">during his<span class="Apple-converted-space"> </span></span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004" style="text-decoration: none; color: rgb(11, 0, 128); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 22.3999996185303px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background: none rgb(255, 255, 255);">campaign to represent Illinois</a><span style="color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 22.3999996185303px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);"><span class="Apple-converted-space"> </span>in</span>
```

### Two Paragraphs:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><p style="margin: 0.5em 0px; line-height: 22.3999996185303px; color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">In 2004, Obama received national attention during his<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">campaign to represent Illinois</a><span class="Apple-converted-space"> </span>in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_Senate" title="United States Senate" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">United States Senate</a><span class="Apple-converted-space"> </span>with his victory in the March<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Democratic_Party_(United_States)" title="Democratic Party (United States)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Democratic Party</a><a href="https://en.wikipedia.org/wiki/Primary_election" title="Primary election" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">primary</a>, his<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address" title="2004 Democratic National Convention keynote address" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">keynote address</a><span class="Apple-converted-space"> </span>at the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention" title="2004 Democratic National Convention" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Democratic National Convention</a><span class="Apple-converted-space"> </span>in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008" title="Barack Obama presidential primary campaign, 2008" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">a close primary campaign</a><span class="Apple-converted-space"> </span>against<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Hillary_Clinton" title="Hillary Clinton" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Hillary Rodham Clinton</a><span class="Apple-converted-space"> </span>in 2008, he won sufficient delegates in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008" title="Democratic Party presidential primaries, 2008" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Democratic Party primaries</a><span class="Apple-converted-space"> </span>to receive the presidential nomination. He then defeated<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Republican_Party_(United_States)" title="Republican Party (United States)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Republican</a><span class="Apple-converted-space"> </span>nominee<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/John_McCain" title="John McCain" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">John McCain</a><span class="Apple-converted-space"> </span>in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008" title="United States presidential election, 2008" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">general election</a>, and was<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama" title="First inauguration of Barack Obama" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">inaugurated as president</a><span class="Apple-converted-space"> </span>on January 20, 2009. Nine months after his inauguration, Obama was named the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize" title="2009 Nobel Peace Prize" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">2009 Nobel Peace Prize</a><span class="Apple-converted-space"> </span>laureate.</p><p style="margin: 0.5em 0px; line-height: 22.3999996185303px; color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">During his first two years in office, Obama signed into law<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Stimulus_(economics)" title="Stimulus (economics)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">economic stimulus</a><span class="Apple-converted-space"> </span>legislation in response to the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Great_Recession" title="Great Recession" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Great Recession</a><span class="Apple-converted-space"> </span>in the form of the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009" title="American Recovery and Reinvestment Act of 2009" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">American Recovery and Reinvestment Act of 2009</a><span class="Apple-converted-space"> </span>and the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010" title="Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</a>. Other major domestic initiatives in his first term included the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act" title="Patient Protection and Affordable Care Act" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Patient Protection and Affordable Care Act</a>, often referred to as "Obamacare"; the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act" title="Dodd–Frank Wall Street Reform and Consumer Protection Act" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Dodd–Frank Wall Street Reform and Consumer Protection Act</a>; and the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010" title="Don't Ask, Don't Tell Repeal Act of 2010" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Don't Ask, Don't Tell Repeal Act of 2010</a>. In foreign policy, Obama<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq" title="Withdrawal of U.S. troops from Iraq" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">ended U.S. military involvement</a><span class="Apple-converted-space"> </span>in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Iraq_War" title="Iraq War" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Iraq War</a>, increased U.S. troop levels in<a href="https://en.wikipedia.org/wiki/War_in_Afghanistan_(2001%E2%80%93present)" title="War in Afghanistan (2001–present)" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Afghanistan</a>, signed the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/New_START" title="New START" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">New START</a><span class="Apple-converted-space"> </span>arms control treaty with<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Russia" title="Russia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Russia</a>, ordered<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya" title="2011 military intervention in Libya" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">U.S. military involvement in Libya</a><span class="Apple-converted-space"> </span>in opposition to<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Muammar_Gaddafi" title="Muammar Gaddafi" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Muammar Gaddafi</a>, and ordered the military operation that resulted in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden" title="Death of Osama bin Laden" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">death of Osama bin Laden</a>. In January 2011,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010" title="United States midterm elections, 2010" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">the Republicans regained control of the House of Representatives</a><span class="Apple-converted-space"> </span>as the Democratic Party lost a total of 63 seats; and, after a lengthy debate over federal spending and whether or not to raise the nation's<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_debt_ceiling" title="United States debt ceiling" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">debt limit</a>, Obama signed the<a href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011" title="Budget Control Act of 2011" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Budget Control Act of 2011</a><span class="Apple-converted-space"> </span>and the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012" title="American Taxpayer Relief Act of 2012" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">American Taxpayer Relief Act of 2012</a>.</p>
```

### Whole Page:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><br class="Apple-interchange-newline"><div id="mw-head-base" class="noprint" style="margin-top: -5em; margin-left: 11em; height: 5em; color: rgb(0, 0, 0); font-family: sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px;"></div><div id="content" class="mw-body" role="main" style="margin-left: 11em; padding: 1.25em 1.5em 1.5em; border-width: 1px 0px 1px 1px; border-style: solid; border-color: rgb(167, 215, 249); margin-top: -1px; color: rgb(37, 37, 37); direction: ltr; font-family: sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);"><a id="top" style="text-decoration: none; color: rgb(6, 69, 173); background: none;"></a><div id="siteNotice" style="position: relative; text-align: center; margin: 0px; font-size: 0.8em;"><div id="centralNotice" class="cn-ESPC2015int"><div class="transparant"><div style="float: right;"><a href="https://en.wikipedia.org/wiki/Synonym#" title="Hide" onclick="hideBanner();return false;" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><img border="0" src="https://upload.wikimedia.org/wikipedia/foundation/2/20/CloseWindow19x19.png" alt="Hide" style="border: none; vertical-align: middle;"></a></div><center><big><img alt="ESPC 2015" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_for_e-Scienc…ext.svg/100px-Logo_for_e-Science_Photo_Competition_v2_without_text.svg.png" title="ESPC 2015" width="100" height="23" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_for_e-Science_Photo_Competition_v2_without_text.svg/150px-Logo_for_e-Science_Photo_Competition_v2_without_text.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_for_e-Science_Photo_Competition_v2_without_text.svg/200px-Logo_for_e-Science_Photo_Competition_v2_without_text.svg.png 2x" data-file-width="668" data-file-height="154" style="border: none; vertical-align: middle;"><span class="Apple-converted-space"> </span><span class="plainlinks"><b><a class="external text" href="https://commons.wikimedia.org/wiki/Commons:European_Science_Photo_Competition_2015" style="text-decoration: none; color: rgb(102, 51, 102); padding: 0px !important; background: none !important;">European Science Photo Competition 2015</a><span class="Apple-converted-space"> </span>– participate now!</b></span></big></center></div></div></div><div class="mw-indicators" style="float: right; line-height: 1.6; font-size: 0.875em; position: relative; z-index: 1; padding-top: 0.4em;"></div><h1 id="firstHeading" class="firstHeading" lang="en" style="color: black; font-weight: normal; margin: 0px 0px 0.25em; overflow: visible; padding: 0px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 1.8em; line-height: 1.3; font-family: 'Linux Libertine', Georgia, Times, serif; background: none;">Synonym</h1><div id="bodyContent" class="mw-body-content" style="position: relative; line-height: 1.6; font-size: 0.875em; z-index: 0;"><div id="siteSub" style="display: block; font-size: 12.8800001144409px;">From Wikipedia, the free encyclopedia</div><div id="contentSub" style="font-size: 11.7600002288818px; line-height: 1.2em; margin: 0px 0px 1.4em 1em; color: rgb(84, 84, 84); width: auto;"></div><div id="jump-to-nav" class="mw-jump" style="overflow: hidden; height: 0px; zoom: 1; -webkit-user-select: none; margin-top: -1.4em; margin-bottom: 1.4em;"><a href="https://en.wikipedia.org/wiki/Synonym#mw-head" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"></a><a href="https://en.wikipedia.org/wiki/Synonym#p-search" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"></a></div><div id="mw-content-text" lang="en" dir="ltr" class="mw-content-ltr" style="direction: ltr;"><div class="hatnote" style="font-style: italic; padding-left: 1.6em; margin-bottom: 0.5em;">This article is about the general meaning of "synonym". For its use in biology, see<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Synonym_(taxonomy)" title="Synonym (taxonomy)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Synonym (taxonomy)</a>.</div><table class="metadata plainlinks ambox ambox-content ambox-Refimprove" role="presentation" style="font-size: 14px; margin: 0px 129.5px; border-width: 1px 1px 1px 10px; border-style: solid; border-color: rgb(170, 170, 170) rgb(170, 170, 170) rgb(170, 170, 170) rgb(242, 133, 0); background: rgb(251, 251, 251);"><tbody><tr><td class="mbox-image" style="border: none; padding: 2px 0px 2px 0.5em; text-align: center;"><div style="width: 52px;"><a href="https://en.wikipedia.org/wiki/File:Question_book-new.svg" class="image" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><img alt="" src="https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Question_book-new.svg/50px-Question_book-new.svg.png" width="50" height="39" srcset="//upload.wikimedia.org/wikipedia/en/thumb/9/99/Question_book-new.svg/75px-Question_book-new.svg.png 1.5x, //upload.wikimedia.org/wikipedia/en/thumb/9/99/Question_book-new.svg/100px-Question_book-new.svg.png 2x" data-file-width="262" data-file-height="204" style="border: none; vertical-align: middle;"></a></div></td><td class="mbox-text" style="border: none; padding: 0.25em 0.5em; width: 946px;"><span class="mbox-text-span">This article<span class="Apple-converted-space"> </span><b>needs additional citations for<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Wikipedia:Verifiability" title="Wikipedia:Verifiability" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">verification</a></b>.<span class="Apple-converted-space"> </span><span class="hide-when-compact">Please help<span class="Apple-converted-space"> </span><a class="external text" href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit" style="text-decoration: none; color: rgb(102, 51, 102); padding: 0px !important; background: none !important;">improve this article</a><span class="Apple-converted-space"> </span>by<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Help:Introduction_to_referencing/1" title="Help:Introduction to referencing/1" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">adding citations to reliable sources</a>. Unsourced material may be challenged and removed.</span><span class="Apple-converted-space"> </span><small><i>(May 2014)</i></small></span></td></tr></tbody></table><div class="thumb tright" style="clear: right; float: right; margin: 0.5em 0px 1.3em 1.4em; width: auto; background-color: transparent;"><div class="thumbinner" style="min-width: 100px; border: 1px solid rgb(204, 204, 204); padding: 3px; font-size: 13.1599998474121px; text-align: center; overflow: hidden; width: 222px; background-color: rgb(249, 249, 249);"><a href="https://en.wikipedia.org/wiki/File:Library_of_Ashurbanipal_synonym_list_tablet.jpg" class="image" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><img alt="" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Library_of_Ashurb…onym_list_tablet.jpg/220px-Library_of_Ashurbanipal_synonym_list_tablet.jpg" width="220" height="322" class="thumbimage" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/6/64/Library_of_Ashurbanipal_synonym_list_tablet.jpg/330px-Library_of_Ashurbanipal_synonym_list_tablet.jpg 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/6/64/Library_of_Ashurbanipal_synonym_list_tablet.jpg/440px-Library_of_Ashurbanipal_synonym_list_tablet.jpg 2x" data-file-width="1829" data-file-height="2676" style="border: 1px solid rgb(204, 204, 204); vertical-align: middle; background-color: rgb(255, 255, 255);"></a><div class="thumbcaption" style="border: none; line-height: 1.4em; padding: 3px; font-size: 12.370400428772px; text-align: left;"><div class="magnify" style="float: right; margin-left: 3px; margin-right: 0px;"><a href="https://en.wikipedia.org/wiki/File:Library_of_Ashurbanipal_synonym_list_tablet.jpg" class="internal" title="Enlarge" style="text-decoration: none; color: rgb(11, 0, 128); display: block; text-indent: 15px; white-space: nowrap; overflow: hidden; width: 15px; height: 11px; -webkit-user-select: none; background: linear-gradient(transparent, transparent), url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…68h5.943v4.904h-5.943z%22%2F%3E%0A%20%20%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A);"></a></div>Synonym list in<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Cuneiform" title="Cuneiform" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">cuneiform</a><span class="Apple-converted-space"> </span>on a clay tablet,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Neo-Assyrian" title="Neo-Assyrian" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Neo-Assyrian</a><span class="Apple-converted-space"> </span>period. Ref:<a rel="nofollow" class="external text" href="http://www.britishmuseum.org/research/search_the_collection_database/search_object_details.aspx?objectid=308401&amp;partid=1" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">K.4375</a><span class="Apple-converted-space"> </span>.</div></div></div><p style="margin: 0.5em 0px; line-height: inherit;">A<span class="Apple-converted-space"> </span><b>synonym</b><span class="Apple-converted-space"> </span>is a word or phrase that means exactly or nearly the same as another word or phrase in the same language. Words that are synonyms are said to be<b>synonymous</b>, and the state of being a synonym is called<span class="Apple-converted-space"> </span><b>synonymy</b>. The word comes from<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Ancient_Greek_language" title="Ancient Greek language" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Ancient Greek</a><span class="Apple-converted-space"> </span><i>syn</i><span class="Apple-converted-space"> </span>(<span lang="grc" xml:lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%83%CF%8D%CE%BD" class="extiw" title="wikt:σύν" style="text-decoration: none; color: rgb(102, 51, 102); background: none;">σύν</a></span>) ("with") and<span class="Apple-converted-space"> </span><i>onoma</i><span class="Apple-converted-space"> </span>(<span lang="grc" xml:lang="grc"><a href="https://en.wiktionary.org/wiki/%E1%BD%84%CE%BD%CE%BF%CE%BC%CE%B1" class="extiw" title="wikt:ὄνομα" style="text-decoration: none; color: rgb(102, 51, 102); background: none;">ὄνομα</a></span>) ("name"). An example of synonyms are the words<span class="Apple-converted-space"> </span><i>begin</i>,<span class="Apple-converted-space"> </span><i>start</i>, and<span class="Apple-converted-space"> </span><i>commence</i>. Words can be synonymous when meant in certain<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Word_sense" title="Word sense" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">senses</a>, even if they are not synonymous in all of their senses. For example, if we talk about a<span class="Apple-converted-space"> </span><i>long time</i><span class="Apple-converted-space"> </span>or an<span class="Apple-converted-space"> </span><i>extended time</i>,<span class="Apple-converted-space"> </span><i>long</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>extended</i><span class="Apple-converted-space"> </span>are synonymous within that<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Context_(language_use)" title="Context (language use)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">context</a>. Synonyms with exact interchangeability share a<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Seme_(semantics)" title="Seme (semantics)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">seme</a><span class="Apple-converted-space"> </span>or denotational<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Sememe" title="Sememe" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">sememe</a>, whereas those with inexactly similar meanings share a broader denotational or connotational<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Sememe" title="Sememe" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">sememe</a><span class="Apple-converted-space"> </span>and thus overlap within a<a href="https://en.wikipedia.org/wiki/Semantic_field" title="Semantic field" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">semantic field</a>. Some academics call the former type<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Cognitive_synonymy" title="Cognitive synonymy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">cognitive synonyms</a><span class="Apple-converted-space"> </span>to distinguish them from the latter type, which they call near-synonyms.<sup id="cite_ref-Stanojevi.C4.87_2009_1-0" class="reference" style="line-height: 1; unicode-bidi: -webkit-isolate; font-size: 11.1999998092651px; font-weight: normal; font-style: normal;"><a href="https://en.wikipedia.org/wiki/Synonym#cite_note-Stanojevi.C4.87_2009-1" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;"><span>[</span>1<span>]</span></a></sup></p><p style="margin: 0.5em 0px; line-height: inherit;">In the figurative sense, two words are sometimes said to be synonymous if they have the same<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Connotation" title="Connotation" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">connotation</a>:</p><blockquote class="templatequote" style="overflow: hidden; margin: 1em 0px; padding: 0px 40px;"><p style="margin: 0.5em 0px; line-height: inherit;">...a widespread impression that ...<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Hollywood" title="Hollywood" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Hollywood</a><span class="Apple-converted-space"> </span>was synonymous with immorality...<sup id="cite_ref-2" class="reference" style="line-height: 1; unicode-bidi: -webkit-isolate; font-size: 11.1999998092651px; font-weight: normal; font-style: normal;"><a href="https://en.wikipedia.org/wiki/Synonym#cite_note-2" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;"><span>[</span>2<span>]</span></a></sup></p><div class="templatequotecite" style="line-height: 1.5em; text-align: left; padding-left: 1.6em; margin-top: 0px;"><cite style="font-style: inherit;">— <a href="https://en.wikipedia.org/wiki/Doris_Kearns_Goodwin" title="Doris Kearns Goodwin" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Doris Kearns Goodwin</a></cite></div></blockquote><p style="margin: 0.5em 0px; line-height: inherit;"><a href="https://en.wikipedia.org/wiki/Metonymy" title="Metonymy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Metonymy</a><span class="Apple-converted-space"> </span>can sometimes be a form of synonymy, as when, for example,<span class="Apple-converted-space"> </span><i>the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/White_House" title="White House" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">White House</a></i><span class="Apple-converted-space"> </span>is used as a synonym of<span class="Apple-converted-space"> </span><i>the administration</i><span class="Apple-converted-space"> </span>in referring to the U.S.<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Executive_(government)" title="Executive (government)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">executive branch</a><span class="Apple-converted-space"> </span>under a specific president. Thus a metonym is a type of synonym, and the word<span class="Apple-converted-space"> </span><i>metonym</i><span class="Apple-converted-space"> </span>is a<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Hyponymy_and_hypernymy" title="Hyponymy and hypernymy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">hyponym</a><span class="Apple-converted-space"> </span>of the word<span class="Apple-converted-space"> </span><i>synonym</i>.</p><p style="margin: 0.5em 0px; line-height: inherit;">The analysis of synonymy,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Polysemy" title="Polysemy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">polysemy</a>, and<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Hyponymy_and_hypernymy" title="Hyponymy and hypernymy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">hyponymy and hypernymy</a><span class="Apple-converted-space"> </span>is vital to<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Taxonomy_(general)" title="Taxonomy (general)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">taxonomy</a><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Ontology_(information_science)" title="Ontology (information science)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">ontology</a><span class="Apple-converted-space"> </span>in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Information_science" title="Information science" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">information-science</a><span class="Apple-converted-space"> </span>senses of those terms. It has applications in<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Pedagogy" title="Pedagogy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">pedagogy</a><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Machine_learning" title="Machine learning" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">machine learning</a>, because they rely on<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Word-sense_disambiguation" title="Word-sense disambiguation" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">word-sense disambiguation</a><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><a href="https://en.wiktionary.org/wiki/schema#Noun" class="extiw" title="wikt:schema" style="text-decoration: none; color: rgb(102, 51, 102); background: none;">schema</a>.</p><p style="margin: 0.5em 0px; line-height: inherit;"></p><div id="toc" class="toc" style="border: 1px solid rgb(170, 170, 170); padding: 7px; font-size: 13.3000001907349px; display: table; zoom: 1; background-color: rgb(249, 249, 249);"><div id="toctitle" style="direction: ltr; text-align: center;"><h2 style="color: black; font-weight: bold; margin: 1em 0px 0.25em; overflow: hidden; padding: 0px; border: none; font-size: 13.3000001907349px; display: inline; font-family: sans-serif; line-height: 1.3; background: none;">Contents</h2><span class="Apple-converted-space"> </span><span class="toctoggle" style="-webkit-user-select: none; font-size: 12.5020008087158px;"> [<a href="https://en.wikipedia.org/wiki/Synonym#" id="togglelink" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">hide</a>] </span></div><ul style="list-style-type: none; margin: 0.3em 0px; padding: 0px; list-style-image: none; text-align: left;"><li class="toclevel-1 tocsection-1" style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Synonym#Examples" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="tocnumber" style="display: table-cell;">1</span><span class="toctext" style="display: table-cell;">Examples</span></a></li><li class="toclevel-1 tocsection-2" style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Synonym#Related_terms" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="tocnumber" style="display: table-cell;">2</span><span class="toctext" style="display: table-cell;">Related terms</span></a></li><li class="toclevel-1 tocsection-3" style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Synonym#See_also" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="tocnumber" style="display: table-cell;">3</span><span class="toctext" style="display: table-cell;">See also</span></a></li><li class="toclevel-1 tocsection-4" style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Synonym#References" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="tocnumber" style="display: table-cell;">4</span><span class="toctext" style="display: table-cell;">References</span></a></li><li class="toclevel-1 tocsection-5" style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Synonym#External_links" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="tocnumber" style="display: table-cell;">5</span><span class="toctext" style="display: table-cell;">External links</span></a></li></ul></div><p style="margin: 0.5em 0px; line-height: inherit;"></p><h2 style="color: black; font-weight: normal; margin: 1em 0px 0.25em; overflow: hidden; padding: 0px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 1.5em; font-family: 'Linux Libertine', Georgia, Times, serif; line-height: 1.3; background: none;"><span class="mw-headline" id="Examples">Examples</span><span class="mw-editsection" style="-webkit-user-select: none; font-size: small; font-weight: normal; margin-left: 1em; vertical-align: baseline; line-height: 1em; display: inline-block; white-space: nowrap; unicode-bidi: -webkit-isolate; font-family: sans-serif;"><span class="mw-editsection-bracket" style="margin-right: 0.25em; color: rgb(85, 85, 85);">[</span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit&amp;section=1" title="Edit section: Examples" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">edit</a><span class="mw-editsection-bracket" style="margin-left: 0.25em; color: rgb(85, 85, 85);">]</span></span></h2><p style="margin: 0.5em 0px; line-height: inherit;">Synonyms can be any<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Part_of_speech" title="Part of speech" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">part of speech</a><span class="Apple-converted-space"> </span>(such as<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Noun" title="Noun" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">nouns</a>,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Verbs" title="Verbs" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">verbs</a>,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Adjective" title="Adjective" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">adjectives</a>,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Adverb" title="Adverb" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">adverbs</a><span class="Apple-converted-space"> </span>or<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Preposition" title="Preposition" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">prepositions</a>), as long as both words belong to the same part of speech. Examples:</p><ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;">verb<ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><i>buy</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>purchase</i></li></ul></li><li style="margin-bottom: 0.1em;">adjective<ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><i>big</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>large</i></li></ul></li><li style="margin-bottom: 0.1em;">adverb<ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><i>quickly</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>speedily</i></li></ul></li><li style="margin-bottom: 0.1em;">preposition<ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><i>on</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>upon</i></li></ul></li></ul><p style="margin: 0.5em 0px; line-height: inherit;">Note that synonyms are defined with respect to certain senses of words; for instance,<span class="Apple-converted-space"> </span><i>pupil</i><span class="Apple-converted-space"> </span>as the<span class="Apple-converted-space"> </span><i>aperture in the iris of the eye</i><span class="Apple-converted-space"> </span>is not synonymous with<span class="Apple-converted-space"> </span><i>student</i>. Such like,<span class="Apple-converted-space"> </span><i>he expired</i><span class="Apple-converted-space"> </span>means the same as<span class="Apple-converted-space"> </span><i>he died</i>, yet<span class="Apple-converted-space"> </span><i>my passport has expired</i><span class="Apple-converted-space"> </span>cannot be replaced by<span class="Apple-converted-space"> </span><i>my passport has died</i>.</p><p style="margin: 0.5em 0px; line-height: inherit;">In English, many synonyms emerged in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Middle_Ages" title="Middle Ages" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Middle Ages</a>, after the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Norman_conquest_of_England" title="Norman conquest of England" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Norman conquest of England</a>. While<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/England" title="England" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">England</a>'s new ruling class spoke<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Norman_French" title="Norman French" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Norman French</a>, the lower classes continued to speak<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Old_English" title="Old English" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Old English</a>(Anglo-Saxon). Thus, today we have synonyms like the Norman-derived<span class="Apple-converted-space"> </span><i>people</i>,<span class="Apple-converted-space"> </span><i>liberty</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>archer</i>, and the Saxon-derived<span class="Apple-converted-space"> </span><i>folk</i>,<span class="Apple-converted-space"> </span><i>freedom</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>bowman</i>. For more examples, see the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/List_of_Germanic_and_Latinate_equivalents_in_English" title="List of Germanic and Latinate equivalents in English" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">list of Germanic and Latinate equivalents in English</a>.</p><p style="margin: 0.5em 0px; line-height: inherit;">Some<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Lexicographer" title="Lexicographer" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">lexicographers</a><span class="Apple-converted-space"> </span>claim that no synonyms have exactly the same meaning (in all contexts or social levels of language) because<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Etymology" title="Etymology" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">etymology</a>,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Orthography" title="Orthography" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">orthography</a>, phonic qualities, ambiguous meanings, usage, etc. make them unique. Different words that are similar in meaning usually differ for a reason:<span class="Apple-converted-space"> </span><i>feline</i><span class="Apple-converted-space"> </span>is more formal than<span class="Apple-converted-space"> </span><i>cat</i>;<span class="Apple-converted-space"> </span><i>long</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>extended</i><span class="Apple-converted-space"> </span>are only synonyms in one usage and not in others (for example, a<i>long arm</i><span class="Apple-converted-space"> </span>is not the same as an<span class="Apple-converted-space"> </span><i>extended arm</i>). Synonyms are also a source of<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Euphemism" title="Euphemism" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">euphemisms</a>.</p><p style="margin: 0.5em 0px; line-height: inherit;">The purpose of a<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Thesaurus" title="Thesaurus" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">thesaurus</a><span class="Apple-converted-space"> </span>is to offer the user a listing of similar or related words; these are often, but not always, synonyms.</p><h2 style="color: black; font-weight: normal; margin: 1em 0px 0.25em; overflow: hidden; padding: 0px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 1.5em; font-family: 'Linux Libertine', Georgia, Times, serif; line-height: 1.3; background: none;"><span class="mw-headline" id="Related_terms">Related terms</span><span class="mw-editsection" style="-webkit-user-select: none; font-size: small; font-weight: normal; margin-left: 1em; vertical-align: baseline; line-height: 1em; display: inline-block; white-space: nowrap; unicode-bidi: -webkit-isolate; font-family: sans-serif;"><span class="mw-editsection-bracket" style="margin-right: 0.25em; color: rgb(85, 85, 85);">[</span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit&amp;section=2" title="Edit section: Related terms" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">edit</a><span class="mw-editsection-bracket" style="margin-left: 0.25em; color: rgb(85, 85, 85);">]</span></span></h2><ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;">The word<span class="Apple-converted-space"> </span><i><b>poecilonym</b></i><span class="Apple-converted-space"> </span>is a rare synonym of the word<span class="Apple-converted-space"> </span><i>synonym</i>. It is not entered in most major dictionaries and is a curiosity or piece of trivia for being an<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Autological_word" title="Autological word" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">autological word</a><span class="Apple-converted-space"> </span>because of its<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Meta" title="Meta" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">meta</a><span class="Apple-converted-space"> </span>quality as a synonym of<span class="Apple-converted-space"> </span><i>synonym</i>.</li><li style="margin-bottom: 0.1em;"><b><a href="https://en.wikipedia.org/wiki/Antonym" title="Antonym" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Antonyms</a></b><span class="Apple-converted-space"> </span>are words with opposite or nearly opposite meanings. For example:<span class="Apple-converted-space"> </span><i>hot</i><span class="Apple-converted-space"> </span>↔<span class="Apple-converted-space"> </span><i>cold</i>,<span class="Apple-converted-space"> </span><i>large</i><span class="Apple-converted-space"> </span>↔<span class="Apple-converted-space"> </span><i>small</i>,<span class="Apple-converted-space"> </span><i>thick</i><span class="Apple-converted-space"> </span>↔<span class="Apple-converted-space"> </span><i>thin</i>,<span class="Apple-converted-space"> </span><i>synonym</i><span class="Apple-converted-space"> </span>↔<span class="Apple-converted-space"> </span><i>antonym</i></li><li style="margin-bottom: 0.1em;"><b><a href="https://en.wikipedia.org/wiki/Hypernym" title="Hypernym" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Hypernyms</a></b><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><b><a href="https://en.wikipedia.org/wiki/Hyponym" title="Hyponym" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">hyponyms</a></b><span class="Apple-converted-space"> </span>are words that refer to, respectively, a general category and a specific instance of that category. For example,<span class="Apple-converted-space"> </span><i>vehicle</i><span class="Apple-converted-space"> </span>is a hypernym of<span class="Apple-converted-space"> </span><i>car</i>, and<span class="Apple-converted-space"> </span><i>car</i><span class="Apple-converted-space"> </span>is a hyponym of<span class="Apple-converted-space"> </span><i>vehicle</i>.</li><li style="margin-bottom: 0.1em;"><b><a href="https://en.wikipedia.org/wiki/Homophone" title="Homophone" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Homophones</a></b><span class="Apple-converted-space"> </span>are words that have the same pronunciation, but different meanings. For example,<span class="Apple-converted-space"> </span><i>witch</i><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><i>which</i><span class="Apple-converted-space"> </span>are homophones in most accents (because they are pronounced the same).</li><li style="margin-bottom: 0.1em;"><b><a href="https://en.wikipedia.org/wiki/Homograph" title="Homograph" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Homographs</a></b><span class="Apple-converted-space"> </span>are words that have the same spelling, but have different pronunciations. For example, one can<span class="Apple-converted-space"> </span><i>record</i><span class="Apple-converted-space"> </span>a song or keep a<span class="Apple-converted-space"> </span><i>record</i><span class="Apple-converted-space"> </span>of documents.</li><li style="margin-bottom: 0.1em;"><b><a href="https://en.wikipedia.org/wiki/Homonym" title="Homonym" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Homonyms</a></b><span class="Apple-converted-space"> </span>are words that have the same pronunciation and spelling, but have different meanings. For example,<span class="Apple-converted-space"> </span><i>rose</i><span class="Apple-converted-space"> </span>(a type of flower) and<span class="Apple-converted-space"> </span><i>rose</i><span class="Apple-converted-space"> </span>(past tense of<span class="Apple-converted-space"> </span><i>rise</i>) are homonyms.</li></ul><h2 style="color: black; font-weight: normal; margin: 1em 0px 0.25em; overflow: hidden; padding: 0px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 1.5em; font-family: 'Linux Libertine', Georgia, Times, serif; line-height: 1.3; background: none;"><span class="mw-headline" id="See_also">See also</span><span class="mw-editsection" style="-webkit-user-select: none; font-size: small; font-weight: normal; margin-left: 1em; vertical-align: baseline; line-height: 1em; display: inline-block; white-space: nowrap; unicode-bidi: -webkit-isolate; font-family: sans-serif;"><span class="mw-editsection-bracket" style="margin-right: 0.25em; color: rgb(85, 85, 85);">[</span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit&amp;section=3" title="Edit section: See also" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">edit</a><span class="mw-editsection-bracket" style="margin-left: 0.25em; color: rgb(85, 85, 85);">]</span></span></h2><ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/-onym" title="-onym" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">-onym</a></li><li style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Synonym_ring" title="Synonym ring" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Synonym ring</a></li><li style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Cognitive_synonymy" title="Cognitive synonymy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Cognitive synonymy</a></li><li style="margin-bottom: 0.1em;"><a href="https://en.wikipedia.org/wiki/Elegant_variation" title="Elegant variation" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Elegant variation</a>, the gratuitous use of a synonym in prose</li></ul><h2 style="color: black; font-weight: normal; margin: 1em 0px 0.25em; overflow: hidden; padding: 0px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 1.5em; font-family: 'Linux Libertine', Georgia, Times, serif; line-height: 1.3; background: none;"><span class="mw-headline" id="References">References</span><span class="mw-editsection" style="-webkit-user-select: none; font-size: small; font-weight: normal; margin-left: 1em; vertical-align: baseline; line-height: 1em; display: inline-block; white-space: nowrap; unicode-bidi: -webkit-isolate; font-family: sans-serif;"><span class="mw-editsection-bracket" style="margin-right: 0.25em; color: rgb(85, 85, 85);">[</span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit&amp;section=4" title="Edit section: References" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">edit</a><span class="mw-editsection-bracket" style="margin-left: 0.25em; color: rgb(85, 85, 85);">]</span></span></h2><div class="reflist" style="font-size: 12.6000003814697px; margin-bottom: 0.5em; list-style-type: decimal;"><ol class="references" style="margin: 0.3em 0px 0.5em 3.2em; padding: 0px; list-style-image: none; font-size: 12.6000003814697px; list-style-type: inherit;"><li id="cite_note-Stanojevi.C4.87_2009-1" style="margin-bottom: 0.1em;"><span class="mw-cite-backlink" style="-webkit-user-select: none;"><b><a href="https://en.wikipedia.org/wiki/Synonym#cite_ref-Stanojevi.C4.87_2009_1-0" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="cite-accessibility-label" style="-webkit-user-select: none; top: -99999px; clip: rect(1px 1px 1px 1px); overflow: hidden; position: absolute !important; padding: 0px !important; border: 0px !important; height: 1px !important; width: 1px !important;">Jump up</span>^</a></b></span><span class="Apple-converted-space"> </span><span class="reference-text"><cite id="CITEREFStanojevi.C4.872009" class="citation" style="font-style: inherit; word-wrap: break-word;">Stanojević, Maja (2009),<span class="Apple-converted-space"> </span><a rel="nofollow" class="external text" href="http://facta.junis.ni.ac.rs/lal/lal200902/lal200902-05.pdf" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 18px; background: url(https://upload.wikimedia.org/wikipedia/commons/2/23/Icons-mini-file_acrobat.gif) 100% 50% no-repeat;">"Cognitive synonymy: a general overview"</a><span class="Apple-converted-space"> </span><span style="font-size: 10.710000038147px;">(PDF)</span>,<span class="Apple-converted-space"> </span><i>Facta Universitatis, Linguistics and Literature series</i><span class="Apple-converted-space"> </span><b>7</b><span class="Apple-converted-space"> </span>(2): 193–200.</cite><span title="ctx_ver=Z39.88-2004&amp;rfr_id=info%3Asid%2Fen.wikipedia.org%3ASynonym&amp;rft.atitle=Cognitive+synonymy%3A+a+general+overview&amp;rft.aufirst=Maja&amp;rft.aulast=Stanojevi%C4%87&amp;rft.date=2009&amp;rft.genre=article&amp;rft_id=http%3A%2F%2Ffacta.junis.ni.ac.rs%2Flal%2Flal200902%2Flal200902-05.pdf&amp;rft.issue=2&amp;rft.jtitle=Facta+Universitatis%2C+Linguistics+and+Literature+series&amp;rft.pages=193-200&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;rft.volume=7" class="Z3988"></span></span></li><li id="cite_note-2" style="margin-bottom: 0.1em;"><span class="mw-cite-backlink" style="-webkit-user-select: none;"><b><a href="https://en.wikipedia.org/wiki/Synonym#cite_ref-2" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><span class="cite-accessibility-label" style="-webkit-user-select: none; top: -99999px; clip: rect(1px 1px 1px 1px); overflow: hidden; position: absolute !important; padding: 0px !important; border: 0px !important; height: 1px !important; width: 1px !important;">Jump up</span>^</a></b></span><span class="Apple-converted-space"> </span><span class="reference-text"><cite class="citation book" style="font-style: inherit; word-wrap: break-word;"><a rel="nofollow" class="external text" href="http://books.google.com/books?id=bGSSl9I4maEC&amp;pg=PA370&amp;dq=a+widespr…n%20that...%20Hollywood%20was%20synonymous%20with%20immorality&amp;f=false" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;"><i>The Fitzgeralds and the Kennedys</i></a>. Macmillan. 1991. p. 370.<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/International_Standard_Book_Number" title="International Standard Book Number" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">ISBN</a> <a href="https://en.wikipedia.org/wiki/Special:BookSources/9780312063542" title="Special:BookSources/9780312063542" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">9780312063542</a><span class="reference-accessdate">. Retrieved<span class="Apple-converted-space"> </span><span class="nowrap" style="white-space: nowrap;">2014-05-27</span></span>.</cite><span title="ctx_ver=Z39.88-2004&amp;rfr_id=info%3Asid%2Fen.wikipedia.org%3ASynonym&amp;rft.btitle=The+Fitzgeralds+and+the+Kennedys&amp;rft.date=1991&amp;rft.genre=book&amp;rft_id=http%3A%2F%2Fbooks.google.com%2Fbooks%3Fid%3DbGSSl9I4maEC%26pg%3DPA370%26dq%3Da%2Bwidespread%2Bimpression%2Bthat...%2BHollywood%2Bwas%2Bsynonymous%2Bwith%2Bimmorality%26hl%3Den%26sa%3DX%26ei%3DIRSEU7roL--_sQSb7IGgCA%26ved%3D0CCsQ6AEwAA%23v%3Donepage%26q%3Da%2520widespread%2520impression%2520that...%2520Hollywood%2520was%2520synonymous%2520with%2520immorality%26f%3Dfalse&amp;rft.isbn=9780312063542&amp;rft.pages=370&amp;rft.pub=Macmillan&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook" class="Z3988"></span></span></li></ol></div><h2 style="color: black; font-weight: normal; margin: 1em 0px 0.25em; overflow: hidden; padding: 0px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 1.5em; font-family: 'Linux Libertine', Georgia, Times, serif; line-height: 1.3; background: none;"><span class="mw-headline" id="External_links">External links</span><span class="mw-editsection" style="-webkit-user-select: none; font-size: small; font-weight: normal; margin-left: 1em; vertical-align: baseline; line-height: 1em; display: inline-block; white-space: nowrap; unicode-bidi: -webkit-isolate; font-family: sans-serif;"><span class="mw-editsection-bracket" style="margin-right: 0.25em; color: rgb(85, 85, 85);">[</span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit&amp;section=5" title="Edit section: External links" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">edit</a><span class="mw-editsection-bracket" style="margin-left: 0.25em; color: rgb(85, 85, 85);">]</span></span></h2><table class="mbox-small plainlinks sistersitebox" style="font-size: 12.3199996948242px; clear: right; float: right; margin: 4px 0px 4px 1em; width: 238px; line-height: 1.25em; border: 1px solid rgb(170, 170, 170); background-color: rgb(249, 249, 249);"><tbody><tr><td class="mbox-image" style="border: none; padding: 2px 0px 2px 0.9em; text-align: center;"><img alt="" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wiktionary-logo-en.svg/37px-Wiktionary-logo-en.svg.png" width="37" height="40" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wiktionary-logo-en.svg/55px-Wiktionary-logo-en.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wiktionary-logo-en.svg/73px-Wiktionary-logo-en.svg.png 2x" data-file-width="1000" data-file-height="1089" style="border: none; vertical-align: middle;"></td><td class="mbox-text plainlist" style="border: none; padding: 0.25em 0.9em; width: 159.84375px;">Look up<span class="Apple-converted-space"> </span><i><b><a href="https://en.wiktionary.org/wiki/Special:Search/synonym" class="extiw" title="wiktionary:Special:Search/synonym" style="text-decoration: none; color: rgb(102, 51, 102); background: none;">synonym</a></b></i><span class="Apple-converted-space"> </span>in Wiktionary, the free dictionary.</td></tr></tbody></table><p style="margin: 0.5em 0px; line-height: inherit;">Tools which graph words relations :</p><ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://graphwords.com/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Graph Words</a><span class="Apple-converted-space"> </span>- Online tool for visualization word relations</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://www.synonyms.net/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Synonyms.net</a><span class="Apple-converted-space"> </span>- Online reference resource that provides instant synonyms and antonyms definitions including visualizations, voice pronunciations and translations</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://dico.isc.cnrs.fr/en/index.html" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">English/French Semantic Atlas</a><span class="Apple-converted-space"> </span>- Graph words relations in English, French and gives cross representations for translations - offers 500 searches per user per day.</li></ul><p style="margin: 0.5em 0px; line-height: inherit;">Plain words synonyms finder :</p><ul style="list-style-type: disc; margin: 0.3em 0px 0px 1.6em; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://www.synonym-finder.com/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Synonym Finder</a><span class="Apple-converted-space"> </span>- Synonym finder including hypernyms in search result</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://www.how-to-say.net/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">how to say</a><span class="Apple-converted-space"> </span>- Online Synonym finder</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://synonymosum.com/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Synonymosum</a><span class="Apple-converted-space"> </span>- Online Synonym Dictionary - words and their synonyms</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://trovami.altervista.org/sinonimi/en" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Thesaurus</a><span class="Apple-converted-space"> </span>- Online synonyms in English, Italian, French and German</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://synonyms.woxikon.com/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Woxikon Synonyms</a><span class="Apple-converted-space"> </span>- Over 1 million synonyms - English, German, Spanish, French, Italian, Portuguese, Swedish and Dutch</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://www.thefreedictionary.com/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Freedictionary.com</a><span class="Apple-converted-space"> </span>Free online English thesaurus and dictionary containing synonyms, related words, antonyms, definitions, idioms and more</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://www.powerthesaurus.org/" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">Power Thesaurus</a><span class="Apple-converted-space"> </span>- Thesaurus with synonyms ordered by rating</li><li style="margin-bottom: 0.1em;"><a rel="nofollow" class="external text" href="http://www.findmewords.com/synonyms.html" style="text-decoration: none; color: rgb(102, 51, 102); padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">FindMeWords Synonyms</a><span class="Apple-converted-space"> </span>- Online Synonym Dictionary with definitions</li></ul><table class="navbox" style="font-size: 12.3199996948242px; border: 1px solid rgb(170, 170, 170); width: 1291px; margin: 1em auto auto; clear: both; text-align: center; padding: 1px; border-spacing: 0px; background: rgb(253, 253, 253);"><tbody><tr><td style="padding: 2px;"><table class="nowraplinks collapsible autocollapse navbox-inner" id="collapsibleTable0" style="font-size: 12.3199996948242px; width: 1287px; border-spacing: 0px; color: inherit; background: transparent;"><tbody><tr><th scope="col" class="navbox-title" colspan="2" style="padding: 0.25em 1em; line-height: 1.5em; text-align: center; background: rgb(204, 204, 255);"><span class="collapseButton" style="float: right; font-weight: normal; margin-left: 0.5em; text-align: right; width: 6em;">[<a id="collapseButton0" href="https://en.wikipedia.org/wiki/Synonym#" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">hide</a>]</span><div class="plainlinks hlist navbar mini" style="display: block; font-size: 12.3199996948242px; font-weight: normal; float: left; text-align: left; margin-right: 0.5em; width: 6em;"><ul style="list-style-type: disc; margin: 0px; padding: 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A); display: inline; white-space: nowrap; line-height: inherit;"><li class="nv-view" style="margin: 0px; display: inline; word-spacing: -0.125em;"><a href="https://en.wikipedia.org/wiki/Template:Lexicology" title="Template:Lexicology" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;"><abbr title="View this template" style="border: none; cursor: inherit; font-variant: small-caps; text-decoration: none; background: none transparent;">v</abbr></a></li><li class="nv-talk" style="margin: 0px; display: inline; word-spacing: -0.125em;"><a href="https://en.wikipedia.org/wiki/Template_talk:Lexicology" title="Template talk:Lexicology" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;"><abbr title="Discuss this template" style="border: none; cursor: inherit; font-variant: small-caps; text-decoration: none; background: none transparent;">t</abbr></a></li><li class="nv-edit" style="margin: 0px; display: inline; word-spacing: -0.125em;"><a class="external text" href="https://en.wikipedia.org/w/index.php?title=Template:Lexicology&amp;action=edit" style="text-decoration: none; color: rgb(102, 51, 102); white-space: nowrap; padding: 0px !important; background: none !important;"><abbr title="Edit this template" style="border: none; cursor: inherit; font-variant: small-caps; text-decoration: none; background: none transparent;">e</abbr></a></li></ul></div><div style="font-size: 14.0447998046875px;"><a href="https://en.wikipedia.org/wiki/Lexicology" title="Lexicology" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexicology</a></div></th></tr><tr style="height: 2px;"><td colspan="2"></td></tr><tr><th scope="row" class="navbox-group" style="padding: 0.25em 1em; line-height: 1.5em; text-align: right; white-space: nowrap; background: rgb(221, 221, 255);">Major terms</th><td class="navbox-list navbox-odd hlist" style="line-height: 1.5em; border-color: rgb(253, 253, 253); text-align: left; border-left-width: 2px; border-left-style: solid; width: 1151px; padding: 0px; background: transparent;"><div style="padding: 0em 0.25em;"><ul style="list-style-type: disc; margin: 0px; padding: 0.125em 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexical_item" title="Lexical item" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexical item</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexicon" title="Lexicon" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexicon</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexis_(linguistics)" title="Lexis (linguistics)" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexis</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Word" title="Word" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Word</a></li></ul></div></td></tr><tr style="height: 2px;"><td colspan="2"></td></tr><tr><th scope="row" class="navbox-group" style="padding: 0.25em 1em; line-height: 1.5em; text-align: right; white-space: nowrap; background: rgb(221, 221, 255);">Elements</th><td class="navbox-list navbox-even hlist" style="line-height: 1.5em; border-color: rgb(253, 253, 253); text-align: left; border-left-width: 2px; border-left-style: solid; width: 1151px; padding: 0px; background: rgb(247, 247, 247);"><div style="padding: 0em 0.25em;"><ul style="list-style-type: disc; margin: 0px; padding: 0.125em 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Cherology" title="Cherology" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Chereme</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Glyph" title="Glyph" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Glyphs</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Grapheme" title="Grapheme" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Grapheme</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lemma_(psycholinguistics)" title="Lemma (psycholinguistics)" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lemma</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexeme" title="Lexeme" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexeme</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Meronymy" title="Meronymy" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Meronymy</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Morpheme" title="Morpheme" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Morpheme</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Phoneme" title="Phoneme" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Phoneme</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Seme_(semantics)" title="Seme (semantics)" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Seme</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Sememe" title="Sememe" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Sememe</a></li></ul></div></td></tr><tr style="height: 2px;"><td colspan="2"></td></tr><tr><th scope="row" class="navbox-group" style="padding: 0.25em 1em; line-height: 1.5em; text-align: right; white-space: nowrap; background: rgb(221, 221, 255);"><a href="https://en.wikipedia.org/wiki/Semantics" title="Semantics" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Semantic relations</a></th><td class="navbox-list navbox-odd hlist" style="line-height: 1.5em; border-color: rgb(253, 253, 253); text-align: left; border-left-width: 2px; border-left-style: solid; width: 1151px; padding: 0px; background: transparent;"><div style="padding: 0em 0.25em;"><ul style="list-style-type: disc; margin: 0px; padding: 0.125em 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Opposite_(semantics)" title="Opposite (semantics)" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Antonymy</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Holonymy" title="Holonymy" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Holonymy</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Hyponymy_and_hypernymy" title="Hyponymy and hypernymy" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Hyponymy and hypernymy</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Idiom" title="Idiom" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Idiom</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexical_semantics" title="Lexical semantics" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexical semantics</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Semantic_network" title="Semantic network" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Semantic network</a></li><li style="margin: 0px; display: inline;"><strong class="selflink" style="font-weight: 700; white-space: nowrap;">Synonym</strong></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Troponymy" title="Troponymy" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Troponymy</a></li></ul></div></td></tr><tr style="height: 2px;"><td colspan="2"></td></tr><tr><th scope="row" class="navbox-group" style="padding: 0.25em 1em; line-height: 1.5em; text-align: right; white-space: nowrap; background: rgb(221, 221, 255);">Functions</th><td class="navbox-list navbox-even hlist" style="line-height: 1.5em; border-color: rgb(253, 253, 253); text-align: left; border-left-width: 2px; border-left-style: solid; width: 1151px; padding: 0px; background: rgb(247, 247, 247);"><div style="padding: 0em 0.25em;"><ul style="list-style-type: disc; margin: 0px; padding: 0.125em 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Function_word" title="Function word" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Function word</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Headword" title="Headword" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Headword</a></li></ul></div></td></tr><tr style="height: 2px;"><td colspan="2"></td></tr><tr><th scope="row" class="navbox-group" style="padding: 0.25em 1em; line-height: 1.5em; text-align: right; white-space: nowrap; background: rgb(221, 221, 255);">Fields</th><td class="navbox-list navbox-odd hlist" style="line-height: 1.5em; border-color: rgb(253, 253, 253); text-align: left; border-left-width: 2px; border-left-style: solid; width: 1151px; padding: 0px; background: transparent;"><div style="padding: 0em 0.25em;"><ul style="list-style-type: disc; margin: 0px; padding: 0.125em 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Controlled_vocabulary" title="Controlled vocabulary" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Controlled vocabulary</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/English_lexicology_and_lexicography" title="English lexicology and lexicography" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">English lexicology and lexicography</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/International_scientific_vocabulary" title="International scientific vocabulary" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">International scientific vocabulary</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexicographic_error" title="Lexicographic error" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexicographic error</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Lexicographic_information_cost" title="Lexicographic information cost" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Lexicographic information cost</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Linguistic_prescription" title="Linguistic prescription" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Linguistic prescription</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Morphology_(linguistics)" title="Morphology (linguistics)" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Morphology</a></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Specialised_lexicography" title="Specialised lexicography" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Specialised lexicography</a></li></ul></div></td></tr></tbody></table></td></tr></tbody></table><table class="navbox" style="font-size: 12.3199996948242px; border: 1px solid rgb(170, 170, 170); width: 1291px; margin: -1px auto auto; clear: both; text-align: center; padding: 1px; border-spacing: 0px; background: rgb(253, 253, 253);"><tbody><tr><td style="padding: 2px;"><table class="nowraplinks hlist navbox-inner" style="font-size: 12.3199996948242px; width: 1287px; border-spacing: 0px; color: inherit; background: transparent;"><tbody><tr><th scope="row" class="navbox-group" style="padding: 0.25em 1em; line-height: 1.5em; text-align: right; white-space: nowrap; background: rgb(221, 221, 255);"><a href="https://en.wikipedia.org/wiki/Help:Authority_control" title="Help:Authority control" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">Authority control</a></th><td class="navbox-list navbox-odd" style="line-height: 1.5em; border-color: rgb(253, 253, 253); text-align: left; border-left-width: 2px; border-left-style: solid; width: 1161px; padding: 0px; background: transparent;"><div style="padding: 0em 0.25em;"><ul style="list-style-type: disc; margin: 0px; padding: 0.125em 0px; list-style-image: url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A);"><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Library_of_Congress_Control_Number" title="Library of Congress Control Number" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">LCCN</a>:<span class="Apple-converted-space"> </span><span class="uid"><a rel="nofollow" class="external text" href="http://id.loc.gov/authorities/subjects/sh85131642" style="text-decoration: none; color: rgb(102, 51, 102); white-space: nowrap; padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">sh85131642</a></span></li><li style="margin: 0px; display: inline;"><a href="https://en.wikipedia.org/wiki/Integrated_Authority_File" title="Integrated Authority File" style="text-decoration: none; color: rgb(11, 0, 128); white-space: nowrap; background: none;">GND</a>:<span class="Apple-converted-space"> </span><span class="uid"><a rel="nofollow" class="external text" href="http://d-nb.info/gnd/4058765-4" style="text-decoration: none; color: rgb(102, 51, 102); white-space: nowrap; padding-right: 13px; background: linear-gradient(transparent, transparent) 100% 50% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22….851-1.851z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E) 100% 50%;">4058765-4</a></span></li></ul></div></td></tr></tbody></table></td></tr></tbody></table></div><div id="catlinks" class="catlinks" style="border: 1px solid rgb(170, 170, 170); padding: 5px; margin-top: 1em; clear: both; text-align: left; background-color: rgb(249, 249, 249);"><div id="mw-normal-catlinks" class="mw-normal-catlinks"><a href="https://en.wikipedia.org/wiki/Help:Category" title="Help:Category" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Categories</a>:<span class="Apple-converted-space"> </span><ul style="list-style: none none; margin: 0px; padding: 0px; display: inline;"><li style="margin: 0.125em 0px; display: inline-block; line-height: 1.25em; border-left-style: none; padding: 0px 0.5em 0px 0.25em; zoom: 1;"><a href="https://en.wikipedia.org/wiki/Category:Lexical_semantics" title="Category:Lexical semantics" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Lexical semantics</a></li><li style="margin: 0.125em 0px; display: inline-block; line-height: 1.25em; border-left-width: 1px; border-left-style: solid; border-left-color: rgb(170, 170, 170); padding: 0px 0.5em; zoom: 1;"><a href="https://en.wikipedia.org/wiki/Category:Types_of_words" title="Category:Types of words" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Types of words</a></li></ul></div></div><div class="visualClear" style="clear: both;"></div></div></div><div id="mw-navigation" style="color: rgb(0, 0, 0); font-family: sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px;"><h2 style="color: black; font-weight: normal; margin: 0px 0px 0.6em; overflow: hidden; padding-top: 0.5em; padding-bottom: 0.17em; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(170, 170, 170); font-size: 24px; position: absolute; top: -9999px; background: none;">Navigation menu</h2><div id="mw-head" style="position: absolute; top: 0px; right: 0px; width: 1520px;"><div id="p-personal" role="navigation" class="" aria-labelledby="p-personal-label" style="position: absolute; top: 0.33em; right: 1em; z-index: 100;"><ul style="list-style-type: none; margin: 0px; padding: 0px 0px 0px 10em; list-style-image: none;"><li id="pt-createaccount" style="margin-bottom: 0.1em; line-height: 1.125em; float: left; margin-left: 0.75em; margin-top: 0.5em; font-size: 0.75em; white-space: nowrap;"><a href="https://en.wikipedia.org/w/index.php?title=Special:UserLogin&amp;returnto=Synonym&amp;type=signup" title="You are encouraged to create an account and log in; however, it is not mandatory" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Create account</a></li><li id="pt-userpage" style="margin-bottom: 0.1em; padding-left: 15px !important; line-height: 1.125em; float: left; margin-left: 0.75em; margin-top: 0.5em; font-size: 0.75em; white-space: nowrap; background-image: linear-gradient(transparent, transparent), url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22…9.625%2C1.673%2C7.95%2C0%2C6.063%2C0L6.063%2C0z%22%2F%3E%0A%3C%2Fsvg%3E%0A); background-position: 0% 0%, 0% 0%; background-repeat: no-repeat;"><span style="color: gray;">Not logged in</span></li><li id="pt-mytalk" style="margin-bottom: 0.1em; line-height: 1.125em; float: left; margin-left: 0.75em; margin-top: 0.5em; font-size: 0.75em; white-space: nowrap;"><a href="https://en.wikipedia.org/wiki/Special:MyTalk" title="Your talk page [alt-shift-n]" accesskey="n" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Talk</a></li><li id="pt-mycontris" style="margin-bottom: 0.1em; line-height: 1.125em; float: left; margin-left: 0.75em; margin-top: 0.5em; font-size: 0.75em; white-space: nowrap;"><a href="https://en.wikipedia.org/wiki/Special:MyContributions" title="A list of your contributions [alt-shift-y]" accesskey="y" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Contributions</a></li><li id="pt-login" style="margin-bottom: 0.1em; line-height: 1.125em; float: left; margin-left: 0.75em; margin-top: 0.5em; font-size: 0.75em; white-space: nowrap;"><a href="https://en.wikipedia.org/w/index.php?title=Special:UserLogin&amp;returnto=Synonym" title="You're encouraged to log in; however, it's not mandatory. [alt-shift-o]" accesskey="o" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Log in</a></li></ul></div><div id="left-navigation" style="float: left; margin-left: 11em; margin-top: 2.5em; margin-bottom: -2.5em; display: inline;"><div id="p-namespaces" role="navigation" class="vectorTabs" aria-labelledby="p-namespaces-label" style="float: left; height: 2.5em; padding-left: 1px; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 0% 100%; background-repeat: no-repeat;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none; float: left; height: 40px; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><li id="ca-nstab-main" class="selected" style="margin: 0px; float: left; line-height: 1.125em; display: block; height: 40px; padding: 0px; white-space: nowrap; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABkAQAAAABvV2fNAAAADUlEQVQIHWNoYBgWEACJ5TIB0K9KcAAAAABJRU5ErkJggg==); background-color: rgb(243, 243, 243); background-position: 0% 100%; background-repeat: repeat-x;"><span style="display: inline-block; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><a href="https://en.wikipedia.org/wiki/Synonym" title="View the content page [alt-shift-c]" accesskey="c" style="text-decoration: none; color: rgb(51, 51, 51); display: block; height: 1.9em; padding-left: 0.5em; padding-right: 0.5em; cursor: pointer; font-size: 0.8em; padding-top: 1.25em; float: left; background: none;">Article</a></span></li><li id="ca-talk" style="margin: 0px; float: left; line-height: 1.125em; display: block; height: 40px; padding: 0px; white-space: nowrap; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABkCAIAAADITs03AAAAPElEQ…v4wQVyGGCSvg2dnJvduT8sz/IwKOIfjCi2z/76FhHeJcslVZQFLUC06LZ/AAAAAElFTkSuQmCC); background-color: rgb(243, 243, 243); background-position: 0% 100%; background-repeat: repeat-x;"><span style="display: inline-block; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><a href="https://en.wikipedia.org/wiki/Talk:Synonym" title="Discussion about the content page [alt-shift-t]" accesskey="t" rel="discussion" style="text-decoration: none; color: rgb(6, 69, 173); display: block; height: 1.9em; padding-left: 0.5em; padding-right: 0.5em; cursor: pointer; font-size: 0.8em; padding-top: 1.25em; float: left; background: none;">Talk</a></span></li></ul></div></div><div id="right-navigation" style="float: right; margin-top: 2.5em;"><div id="p-views" role="navigation" class="vectorTabs" aria-labelledby="p-views-label" style="float: left; height: 2.5em; padding-left: 1px; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 0% 100%; background-repeat: no-repeat;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none; float: left; height: 40px; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><li id="ca-view" class="selected" style="margin: 0px; float: left; line-height: 1.125em; display: block; height: 40px; padding: 0px; white-space: nowrap; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABkAQAAAABvV2fNAAAADUlEQVQIHWNoYBgWEACJ5TIB0K9KcAAAAABJRU5ErkJggg==); background-color: rgb(243, 243, 243); background-position: 0% 100%; background-repeat: repeat-x;"><span style="display: inline-block; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><a href="https://en.wikipedia.org/wiki/Synonym" style="text-decoration: none; color: rgb(51, 51, 51); display: block; height: 1.9em; padding-left: 0.5em; padding-right: 0.5em; cursor: pointer; font-size: 0.8em; padding-top: 1.25em; float: left; background: none;">Read</a></span></li><li id="ca-edit" style="margin: 0px; float: left; line-height: 1.125em; display: block; height: 40px; padding: 0px; white-space: nowrap; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABkCAIAAADITs03AAAAPElEQ…v4wQVyGGCSvg2dnJvduT8sz/IwKOIfjCi2z/76FhHeJcslVZQFLUC06LZ/AAAAAElFTkSuQmCC); background-color: rgb(243, 243, 243); background-position: 0% 100%; background-repeat: repeat-x;"><span style="display: inline-block; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit" title="Edit this page [alt-shift-e]" accesskey="e" style="text-decoration: none; color: rgb(6, 69, 173); display: block; height: 1.9em; padding-left: 0.5em; padding-right: 0.5em; cursor: pointer; font-size: 0.8em; padding-top: 1.25em; float: left; background: none;">Edit</a></span></li><li id="ca-history" class="collapsible" style="margin: 0px; float: left; line-height: 1.125em; display: block; height: 40px; padding: 0px; white-space: nowrap; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABkCAIAAADITs03AAAAPElEQ…v4wQVyGGCSvg2dnJvduT8sz/IwKOIfjCi2z/76FhHeJcslVZQFLUC06LZ/AAAAAElFTkSuQmCC); background-color: rgb(243, 243, 243); background-position: 0% 100%; background-repeat: repeat-x;"><span style="display: inline-block; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAuCAIAAABmjeQ9AAAARElEQ…gIhUYYV/qogdP75J01V+JwrKZr/5YPcnzN3e6t7l+2K+EFX91B1daOi7sAAAAASUVORK5CYII=); background-position: 100% 100%; background-repeat: no-repeat;"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=history" title="Past revisions of this page [alt-shift-h]" accesskey="h" style="text-decoration: none; color: rgb(6, 69, 173); display: block; height: 1.9em; padding-left: 0.5em; padding-right: 0.5em; cursor: pointer; font-size: 0.8em; padding-top: 1.25em; float: left; background: none;">View history</a></span></li></ul></div><div id="p-search" role="search" style="float: left; margin-right: 1em; margin-left: 0.5em;"><form action="https://en.wikipedia.org/w/index.php" id="searchform" style="border: none; margin: 0.4em 0px 0px;"><div id="simpleSearch" style="display: block; width: 20vw; min-width: 5em; max-width: 20em; padding-right: 1.4em; height: 1.4em; margin-top: 0.65em; position: relative; min-height: 1px; border: 1px solid rgb(170, 170, 170); color: black; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAQCAIAAABY/YLgAAAAJUlEQVQIHQXBsQEAAAjDoND/73UWdnerhmHVsDQZJrNWVg3Dqge6bgMe6bejNAAAAABJRU5ErkJggg==); background-color: white; background-position: 0% 0%; background-repeat: repeat-x;"><input type="search" name="search" placeholder="Search" title="Search Wikipedia [alt-shift-f]" accesskey="f" id="searchInput" tabindex="1" autocomplete="off" style="direction: ltr; margin: 0px; padding: 0.2em 0px 0.2em 0.2em; border: 0px; color: black; width: 307px; font-size: 13px; -webkit-appearance: textfield; background-color: transparent;"><input type="submit" name="go" value="Go" title="Go to a page with this exact name if it exists" id="searchButton" class="searchButton" style="direction: ltr; margin: 0px; padding: 0px; border: 0px; color: black; position: absolute; top: 0px; right: 0px; width: 1.65em; height: 22.390625px; cursor: pointer; text-indent: -99999px; line-height: 1; white-space: nowrap; overflow: hidden; background-image: linear-gradient(transparent, transparent), url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…le%20cx%3D%225%22%20cy%3D%225%22%20r%3D%224%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E); background-color: transparent; background-position: 50% 50%, 50% 50%; background-repeat: no-repeat;"></div></form></div></div></div><div id="mw-panel" style="padding-left: 0.5em; font-size: inherit; position: absolute; top: 160px; padding-top: 1em; width: 10em; left: 0px;"><div id="p-logo" role="banner" style="position: absolute; top: -160px; left: 0.5em; width: 10em; height: 160px;"><a class="mw-wiki-logo" href="https://en.wikipedia.org/wiki/Main_Page" title="Visit the main page" style="text-decoration: none; color: rgb(11, 0, 128); display: block; width: 10em; height: 160px; background: url(https://en.wikipedia.org/static/images/project-logos/enwiki.png) 50% 50% no-repeat;"></a></div><div class="portal" role="navigation" id="p-navigation" aria-labelledby="p-navigation-label" style="margin: 0px 0.6em 0px 0.7em; padding: 0.25em 0px; direction: ltr; background-image: none; background-position: 0% 0%; background-repeat: no-repeat;"><div class="body" style="margin: 0px 0px 0px 0.5em; padding-top: 0px;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none;"><li id="n-mainpage-description" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Main_Page" title="Visit the main page [alt-shift-z]" accesskey="z" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Main page</a></li><li id="n-contents" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Portal:Contents" title="Guides to browsing Wikipedia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Contents</a></li><li id="n-featuredcontent" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Portal:Featured_content" title="Featured content – the best of Wikipedia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Featured content</a></li><li id="n-currentevents" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Portal:Current_events" title="Find background information on current events" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Current events</a></li><li id="n-randompage" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Special:Random" title="Load a random article [alt-shift-x]" accesskey="x" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Random article</a></li><li id="n-sitesupport" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://donate.wikimedia.org/wiki/Special:FundraiserRedirector?utm_source=d…mp;utm_medium=sidebar&amp;utm_campaign=C13_en.wikipedia.org&amp;uselang=en" title="Support us" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Donate to Wikipedia</a></li><li id="n-shoplink" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://shop.wikimedia.org/" title="Visit the Wikipedia store" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Wikipedia store</a></li></ul></div></div><div class="portal" role="navigation" id="p-interaction" aria-labelledby="p-interaction-label" style="margin: 0px 0.6em 0px 0.7em; padding: 0.25em 0px; direction: ltr; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAABCAAAAAAphRnkAAAAJ0lEQVQIW7XFsQEAIAyAMPD/b7uLWz8wS5youFW1UREfiIpH1Q2VBz7fGPS1dOGeAAAAAElFTkSuQmCC); background-position: 0% 0%; background-repeat: no-repeat;"><h3 id="p-interaction-label" style="color: rgb(77, 77, 77); font-weight: normal; margin: 0px; overflow: hidden; padding: 0.25em 0px 0.25em 0.25em; border: none; font-size: 0.75em; cursor: default; background: none;">Interaction</h3><div class="body" style="margin: 0px 0px 0px 1.25em; padding-top: 0px;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none;"><li id="n-help" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Help:Contents" title="Guidance on how to use and edit Wikipedia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Help</a></li><li id="n-aboutsite" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Wikipedia:About" title="Find out about Wikipedia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">About Wikipedia</a></li><li id="n-portal" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Wikipedia:Community_portal" title="About the project, what you can do, where to find things" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Community portal</a></li><li id="n-recentchanges" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Special:RecentChanges" title="A list of recent changes in the wiki [alt-shift-r]" accesskey="r" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Recent changes</a></li><li id="n-contactpage" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Wikipedia:Contact_us" title="How to contact Wikipedia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Contact page</a></li></ul></div></div><div class="portal" role="navigation" id="p-tb" aria-labelledby="p-tb-label" style="margin: 0px 0.6em 0px 0.7em; padding: 0.25em 0px; direction: ltr; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAABCAAAAAAphRnkAAAAJ0lEQVQIW7XFsQEAIAyAMPD/b7uLWz8wS5youFW1UREfiIpH1Q2VBz7fGPS1dOGeAAAAAElFTkSuQmCC); background-position: 0% 0%; background-repeat: no-repeat;"><h3 id="p-tb-label" style="color: rgb(77, 77, 77); font-weight: normal; margin: 0px; overflow: hidden; padding: 0.25em 0px 0.25em 0.25em; border: none; font-size: 0.75em; cursor: default; background: none;">Tools</h3><div class="body" style="margin: 0px 0px 0px 1.25em; padding-top: 0px;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none;"><li id="t-whatlinkshere" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Special:WhatLinksHere/Synonym" title="List of all English Wikipedia pages containing links to this page [alt-shift-j]" accesskey="j" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">What links here</a></li><li id="t-recentchangeslinked" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Special:RecentChangesLinked/Synonym" title="Recent changes in pages linked from this page [alt-shift-k]" accesskey="k" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Related changes</a></li><li id="t-upload" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Wikipedia:File_Upload_Wizard" title="Upload files [alt-shift-u]" accesskey="u" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Upload file</a></li><li id="t-specialpages" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/wiki/Special:SpecialPages" title="A list of all special pages [alt-shift-q]" accesskey="q" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Special pages</a></li><li id="t-permalink" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;oldid=690006505" title="Permanent link to this revision of the page" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Permanent link</a></li><li id="t-info" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=info" title="More information about this page" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Page information</a></li><li id="t-wikibase" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://www.wikidata.org/wiki/Q42106" title="Link to connected data repository item [alt-shift-g]" accesskey="g" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Wikidata item</a></li><li id="t-cite" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/w/index.php?title=Special:CiteThisPage&amp;page=Synonym&amp;id=690006505" title="Information on how to cite this page" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Cite this page</a></li></ul></div></div><div class="portal" role="navigation" id="p-coll-print_export" aria-labelledby="p-coll-print_export-label" style="margin: 0px 0.6em 0px 0.7em; padding: 0.25em 0px; direction: ltr; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAABCAAAAAAphRnkAAAAJ0lEQVQIW7XFsQEAIAyAMPD/b7uLWz8wS5youFW1UREfiIpH1Q2VBz7fGPS1dOGeAAAAAElFTkSuQmCC); background-position: 0% 0%; background-repeat: no-repeat;"><h3 id="p-coll-print_export-label" style="color: rgb(77, 77, 77); font-weight: normal; margin: 0px; overflow: hidden; padding: 0.25em 0px 0.25em 0.25em; border: none; font-size: 0.75em; cursor: default; background: none;">Print/export</h3><div class="body" style="margin: 0px 0px 0px 1.25em; padding-top: 0px;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none;"><li id="coll-create_a_book" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=book_creator&amp;referer=Synonym" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Create a book</a></li><li id="coll-download-as-rdf2latex" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=render_…itle=Synonym&amp;returnto=Synonym&amp;oldid=690006505&amp;writer=rdf2latex" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Download as PDF</a></li><li id="t-print" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;printable=yes" title="Printable version of this page [alt-shift-p]" accesskey="p" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Printable version</a></li></ul></div></div><div class="portal" role="navigation" id="p-lang" aria-labelledby="p-lang-label" style="margin: 0px 0.6em 0px 0.7em; padding: 0.25em 0px; direction: ltr; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAABCAAAAAAphRnkAAAAJ0lEQVQIW7XFsQEAIAyAMPD/b7uLWz8wS5youFW1UREfiIpH1Q2VBz7fGPS1dOGeAAAAAElFTkSuQmCC); background-position: 0% 0%; background-repeat: no-repeat;"><span class="uls-settings-trigger" title="Language settings" tabindex="0" role="button" aria-haspopup="true" style="height: 16px; width: 14px; float: right; cursor: pointer; margin-top: 3px; background: linear-gradient(transparent, transparent) 100% 0% no-repeat, url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22…%22%20xlink%3Ahref%3D%22%23a%22%20fill%3D%22%23555%22%2F%3E%3C%2Fsvg%3E%0A) 100% 0% transparent;"></span><h3 id="p-lang-label" style="color: rgb(77, 77, 77); font-weight: normal; margin: 0px; overflow: hidden; padding: 0.25em 0px 0.25em 0.25em; border: none; font-size: 0.75em; cursor: default; background: none;">Languages</h3><div class="body" style="margin: 0px 0px 0px 1.25em; padding-top: 0px;"><ul style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none;"><li class="interlanguage-link interwiki-af" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://af.wikipedia.org/wiki/Sinoniem" title="Sinoniem – Afrikaans" lang="af" hreflang="af" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Afrikaans</a></li><li class="interlanguage-link interwiki-ar" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ar.wikipedia.org/wiki/%D8%AA%D8%B1%D8%A7%D8%AF%D9%81" title="ترادف – Arabic" lang="ar" hreflang="ar" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">العربية</a></li><li class="interlanguage-link interwiki-az" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://az.wikipedia.org/wiki/Sinoniml%C9%99r" title="Sinonimlər – Azerbaijani" lang="az" hreflang="az" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Azərbaycanca</a></li><li class="interlanguage-link interwiki-be" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://be.wikipedia.org/wiki/%D0%A1%D1%96%D0%BD%D0%BE%D0%BD%D1%96%D0%BC%D1%8B" title="Сінонімы – Belarusian" lang="be" hreflang="be" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Беларуская</a></li><li class="interlanguage-link interwiki-be-x-old" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://be-x-old.wikipedia.org/wiki/%D0%A1%D1%8B%D0%BD%D0%BE%D0%BD%D1%96%D0%BC%D1%8B" title="Сынонімы – беларуская (тарашкевіца)‎" lang="be-x-old" hreflang="be-x-old" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Беларуская (тарашкевіца)‎</a></li><li class="interlanguage-link interwiki-bg" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://bg.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Bulgarian" lang="bg" hreflang="bg" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Български</a></li><li class="interlanguage-link interwiki-bar" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://bar.wikipedia.org/wiki/Synonym" title="Synonym – Bavarian" lang="bar" hreflang="bar" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Boarisch</a></li><li class="interlanguage-link interwiki-ca" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ca.wikipedia.org/wiki/Sin%C3%B2nim" title="Sinònim – Catalan" lang="ca" hreflang="ca" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Català</a></li><li class="interlanguage-link interwiki-cv" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://cv.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC%D1%81%D0%B5%D0%BC" title="Синонимсем – Chuvash" lang="cv" hreflang="cv" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Чӑвашла</a></li><li class="interlanguage-link interwiki-cs" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://cs.wikipedia.org/wiki/Synonymum" title="Synonymum – Czech" lang="cs" hreflang="cs" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Čeština</a></li><li class="interlanguage-link interwiki-cy" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://cy.wikipedia.org/wiki/Cyfystyr" title="Cyfystyr – Welsh" lang="cy" hreflang="cy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Cymraeg</a></li><li class="interlanguage-link interwiki-da" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://da.wikipedia.org/wiki/Synonym" title="Synonym – Danish" lang="da" hreflang="da" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Dansk</a></li><li class="interlanguage-link interwiki-de" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://de.wikipedia.org/wiki/Synonym" title="Synonym – German" lang="de" hreflang="de" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Deutsch</a></li><li class="interlanguage-link interwiki-et" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://et.wikipedia.org/wiki/S%C3%BCnon%C3%BC%C3%BCm" title="Sünonüüm – Estonian" lang="et" hreflang="et" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Eesti</a></li><li class="interlanguage-link interwiki-el" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://el.wikipedia.org/wiki/%CE%A3%CF%85%CE%BD%CF%8E%CE%BD%CF%85%CE%BC%CE%BF" title="Συνώνυμο – Greek" lang="el" hreflang="el" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Ελληνικά</a></li><li class="interlanguage-link interwiki-es" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://es.wikipedia.org/wiki/Sinonimia_(sem%C3%A1ntica)" title="Sinonimia (semántica) – Spanish" lang="es" hreflang="es" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Español</a></li><li class="interlanguage-link interwiki-eo" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://eo.wikipedia.org/wiki/Sinonimo" title="Sinonimo – Esperanto" lang="eo" hreflang="eo" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Esperanto</a></li><li class="interlanguage-link interwiki-eu" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://eu.wikipedia.org/wiki/Sinonimo" title="Sinonimo – Basque" lang="eu" hreflang="eu" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Euskara</a></li><li class="interlanguage-link interwiki-fa" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://fa.wikipedia.org/wiki/%D9%85%D8%AA%D8%B1%D8%A7%D8%AF%D9%81" title="مترادف – Persian" lang="fa" hreflang="fa" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">فارسی</a></li><li class="interlanguage-link interwiki-fo" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://fo.wikipedia.org/wiki/Samheiti" title="Samheiti – Faroese" lang="fo" hreflang="fo" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Føroyskt</a></li><li class="interlanguage-link interwiki-fr" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://fr.wikipedia.org/wiki/Synonymie" title="Synonymie – French" lang="fr" hreflang="fr" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Français</a></li><li class="interlanguage-link interwiki-ga" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ga.wikipedia.org/wiki/Comhchiallach" title="Comhchiallach – Irish" lang="ga" hreflang="ga" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Gaeilge</a></li><li class="interlanguage-link interwiki-gl" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://gl.wikipedia.org/wiki/Sinonimia" title="Sinonimia – Galician" lang="gl" hreflang="gl" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Galego</a></li><li class="interlanguage-link interwiki-ko" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ko.wikipedia.org/wiki/%EB%8F%99%EC%9D%98%EC%96%B4" title="동의어 – Korean" lang="ko" hreflang="ko" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">한국어</a></li><li class="interlanguage-link interwiki-hy" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://hy.wikipedia.org/wiki/%D5%80%D5%B8%D5%B4%D5%A1%D5%B6%D5%AB%D5%B7" title="Հոմանիշ – Armenian" lang="hy" hreflang="hy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Հայերեն</a></li><li class="interlanguage-link interwiki-hi" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://hi.wikipedia.org/wiki/%E0%A4%AA%E0%A4%B0%E0%A5%8D%E0%A4%AF%E0%A4%BE%E0%A4%AF%E0%A4%B5%E0%A4%BE%E0%A4%9A%E0%A5%80" title="पर्यायवाची – Hindi" lang="hi" hreflang="hi" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">हिन्दी</a></li><li class="interlanguage-link interwiki-hr" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://hr.wikipedia.org/wiki/Sinonim" title="Sinonim – Croatian" lang="hr" hreflang="hr" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Hrvatski</a></li><li class="interlanguage-link interwiki-io" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://io.wikipedia.org/wiki/Sinonimo" title="Sinonimo – Ido" lang="io" hreflang="io" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Ido</a></li><li class="interlanguage-link interwiki-id" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://id.wikipedia.org/wiki/Sinonim" title="Sinonim – Indonesian" lang="id" hreflang="id" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Bahasa Indonesia</a></li><li class="interlanguage-link interwiki-ia" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ia.wikipedia.org/wiki/Synonymo" title="Synonymo – Interlingua" lang="ia" hreflang="ia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Interlingua</a></li><li class="interlanguage-link interwiki-is" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://is.wikipedia.org/wiki/Samheiti" title="Samheiti – Icelandic" lang="is" hreflang="is" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Íslenska</a></li><li class="interlanguage-link interwiki-it" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://it.wikipedia.org/wiki/Sinonimia" title="Sinonimia – Italian" lang="it" hreflang="it" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Italiano</a></li><li class="interlanguage-link interwiki-he" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://he.wikipedia.org/wiki/%D7%9E%D7%99%D7%9C%D7%94_%D7%A0%D7%A8%D7%93%D7%A4%D7%AA" title="מילה נרדפת – Hebrew" lang="he" hreflang="he" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">עברית</a></li><li class="interlanguage-link interwiki-jv" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://jv.wikipedia.org/wiki/Dasanama" title="Dasanama – Javanese" lang="jv" hreflang="jv" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Basa Jawa</a></li><li class="interlanguage-link interwiki-ka" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ka.wikipedia.org/wiki/%E1%83%A1%E1%83%98%E1%83%9C%E1%83%9D%E1%83%9C%E1%83%98%E1%83%9B%E1%83%94%E1%83%91%E1%83%98" title="სინონიმები – Georgian" lang="ka" hreflang="ka" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">ქართული</a></li><li class="interlanguage-link interwiki-kk" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://kk.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Kazakh" lang="kk" hreflang="kk" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Қазақша</a></li><li class="interlanguage-link interwiki-ku" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ku.wikipedia.org/wiki/Hevwate" title="Hevwate – Kurdish" lang="ku" hreflang="ku" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Kurdî</a></li><li class="interlanguage-link interwiki-la" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://la.wikipedia.org/wiki/Synonymia" title="Synonymia – Latin" lang="la" hreflang="la" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Latina</a></li><li class="interlanguage-link interwiki-lv" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://lv.wikipedia.org/wiki/Sinon%C4%ABms" title="Sinonīms – Latvian" lang="lv" hreflang="lv" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Latviešu</a></li><li class="interlanguage-link interwiki-lb" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://lb.wikipedia.org/wiki/Synonymie" title="Synonymie – Luxembourgish" lang="lb" hreflang="lb" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Lëtzebuergesch</a></li><li class="interlanguage-link interwiki-lt" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://lt.wikipedia.org/wiki/Sinonimas" title="Sinonimas – Lithuanian" lang="lt" hreflang="lt" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Lietuvių</a></li><li class="interlanguage-link interwiki-hu" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://hu.wikipedia.org/wiki/Szinon%C3%ADmia" title="Szinonímia – Hungarian" lang="hu" hreflang="hu" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Magyar</a></li><li class="interlanguage-link interwiki-mk" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://mk.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Macedonian" lang="mk" hreflang="mk" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Македонски</a></li><li class="interlanguage-link interwiki-ml" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ml.wikipedia.org/wiki/%E0%B4%AA%E0%B4%B0%E0%B5%8D%E0%B4%AF%E0%B4%BE%E0%B4%AF%E0%B4%AA%E0%B4%A6%E0%B4%82" title="പര്യായപദം – Malayalam" lang="ml" hreflang="ml" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">മലയാളം</a></li><li class="interlanguage-link interwiki-ms" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ms.wikipedia.org/wiki/Sinonim" title="Sinonim – Malay" lang="ms" hreflang="ms" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Bahasa Melayu</a></li><li class="interlanguage-link interwiki-nl" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://nl.wikipedia.org/wiki/Synoniem_(taalkunde)" title="Synoniem (taalkunde) – Dutch" lang="nl" hreflang="nl" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Nederlands</a></li><li class="interlanguage-link interwiki-ja" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ja.wikipedia.org/wiki/%E9%A1%9E%E7%BE%A9%E8%AA%9E" title="類義語 – Japanese" lang="ja" hreflang="ja" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">日本語</a></li><li class="interlanguage-link interwiki-ce" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ce.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC%D0%B0%D1%88" title="Синонимаш – Chechen" lang="ce" hreflang="ce" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Нохчийн</a></li><li class="interlanguage-link interwiki-no" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://no.wikipedia.org/wiki/Synonym" title="Synonym – Norwegian" lang="no" hreflang="no" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Norsk bokmål</a></li><li class="interlanguage-link interwiki-nn" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://nn.wikipedia.org/wiki/Synonym" title="Synonym – Norwegian Nynorsk" lang="nn" hreflang="nn" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Norsk nynorsk</a></li><li class="interlanguage-link interwiki-uz" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://uz.wikipedia.org/wiki/Sinonimlar" title="Sinonimlar – Uzbek" lang="uz" hreflang="uz" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Oʻzbekcha/ўзбекча</a></li><li class="interlanguage-link interwiki-pfl" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://pfl.wikipedia.org/wiki/Wort:Synonyme" title="Wort:Synonyme – Palatine German" lang="pfl" hreflang="pfl" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Pälzisch</a></li><li class="interlanguage-link interwiki-pl" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://pl.wikipedia.org/wiki/Synonim" title="Synonim – Polish" lang="pl" hreflang="pl" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Polski</a></li><li class="interlanguage-link interwiki-pt" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://pt.wikipedia.org/wiki/Sin%C3%B4nimo" title="Sinônimo – Portuguese" lang="pt" hreflang="pt" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Português</a></li><li class="interlanguage-link interwiki-ro" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ro.wikipedia.org/wiki/Sinonim" title="Sinonim – Romanian" lang="ro" hreflang="ro" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Română</a></li><li class="interlanguage-link interwiki-qu" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://qu.wikipedia.org/wiki/Kaqlla_simi" title="Kaqlla simi – Quechua" lang="qu" hreflang="qu" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Runa Simi</a></li><li class="interlanguage-link interwiki-ru" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ru.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC%D1%8B" title="Синонимы – Russian" lang="ru" hreflang="ru" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Русский</a></li><li class="interlanguage-link interwiki-sco" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sco.wikipedia.org/wiki/Synonym" title="Synonym – Scots" lang="sco" hreflang="sco" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Scots</a></li><li class="interlanguage-link interwiki-sq" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sq.wikipedia.org/wiki/Sinonimi" title="Sinonimi – Albanian" lang="sq" hreflang="sq" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Shqip</a></li><li class="interlanguage-link interwiki-simple" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://simple.wikipedia.org/wiki/Synonym" title="Synonym – Simple English" lang="simple" hreflang="simple" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Simple English</a></li><li class="interlanguage-link interwiki-sk" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sk.wikipedia.org/wiki/Synonymum" title="Synonymum – Slovak" lang="sk" hreflang="sk" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Slovenčina</a></li><li class="interlanguage-link interwiki-sl" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sl.wikipedia.org/wiki/Sopomenka" title="Sopomenka – Slovenian" lang="sl" hreflang="sl" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Slovenščina</a></li><li class="interlanguage-link interwiki-sr" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sr.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Serbian" lang="sr" hreflang="sr" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Српски / srpski</a></li><li class="interlanguage-link interwiki-sh" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sh.wikipedia.org/wiki/Sinonim" title="Sinonim – Serbo-Croatian" lang="sh" hreflang="sh" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Srpskohrvatski / српскохрватски</a></li><li class="interlanguage-link interwiki-su" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://su.wikipedia.org/wiki/Sinonim" title="Sinonim – Sundanese" lang="su" hreflang="su" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Basa Sunda</a></li><li class="interlanguage-link interwiki-fi" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://fi.wikipedia.org/wiki/Synonymia" title="Synonymia – Finnish" lang="fi" hreflang="fi" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Suomi</a></li><li class="interlanguage-link interwiki-sv" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://sv.wikipedia.org/wiki/Synonym" title="Synonym – Swedish" lang="sv" hreflang="sv" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Svenska</a></li><li class="interlanguage-link interwiki-ta" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ta.wikipedia.org/wiki/%E0%AE%92%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AE%9A%E0%AF%8A%E0%AE%B2%E0%AF%8D" title="ஒத்தசொல் – Tamil" lang="ta" hreflang="ta" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">தமிழ்</a></li><li class="interlanguage-link interwiki-tt" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://tt.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Tatar" lang="tt" hreflang="tt" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Татарча/tatarça</a></li><li class="interlanguage-link interwiki-te" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://te.wikipedia.org/wiki/%E0%B0%AA%E0%B0%B0%E0%B1%8D%E0%B0%AF%E0%B0%BE%E0%B0%AF%E0%B0%AA%E0%B0%A6%E0%B0%82" title="పర్యాయపదం – Telugu" lang="te" hreflang="te" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">తెలుగు</a></li><li class="interlanguage-link interwiki-tr" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://tr.wikipedia.org/wiki/E%C5%9Fanlaml%C4%B1" title="Eşanlamlı – Turkish" lang="tr" hreflang="tr" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Türkçe</a></li><li class="interlanguage-link interwiki-uk" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://uk.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D1%96%D0%BC" title="Синонім – Ukrainian" lang="uk" hreflang="uk" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Українська</a></li><li class="interlanguage-link interwiki-ur" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://ur.wikipedia.org/wiki/%D9%85%D8%AA%D8%B1%D8%A7%D8%AF%D9%81" title="مترادف – Urdu" lang="ur" hreflang="ur" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">اردو</a></li><li class="interlanguage-link interwiki-vi" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://vi.wikipedia.org/wiki/T%E1%BB%AB_%C4%91%E1%BB%93ng_ngh%C4%A9a" title="Từ đồng nghĩa – Vietnamese" lang="vi" hreflang="vi" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Tiếng Việt</a></li><li class="interlanguage-link interwiki-wa" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://wa.wikipedia.org/wiki/Sinonimeye" title="Sinonimeye – Walloon" lang="wa" hreflang="wa" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Walon</a></li><li class="interlanguage-link interwiki-zh-yue" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://zh-yue.wikipedia.org/wiki/%E5%90%8C%E7%BE%A9%E8%A9%9E" title="同義詞 – Cantonese" lang="zh-yue" hreflang="zh-yue" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">粵語</a></li><li class="interlanguage-link interwiki-zh" style="margin: 0px; line-height: 1.125em; padding: 0.25em 0px; font-size: 0.75em; word-wrap: break-word;"><a href="https://zh.wikipedia.org/wiki/%E5%90%8C%E4%B9%89%E8%AF%8D" title="同义词 – Chinese" lang="zh" hreflang="zh" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">中文</a></li></ul><div class="after-portlet after-portlet-lang"><span class="wb-langlinks-edit wb-langlinks-link" style="line-height: 1.125em; font-size: 0.75em; float: right; list-style: none none; text-align: right; padding-right: 0.5em !important;"><a href="https://www.wikidata.org/wiki/Q42106#sitelinks-wikipedia" title="Edit interlanguage links" class="wbc-editpage" style="text-decoration: none; color: rgb(121, 121, 121) !important; padding-left: 11px; background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAD1BMV…djYGBgYGIAASUFENNJCUiqmADZTM5OqExFFZAKRSG4YgBjcwODynSgDwAAAABJRU5ErkJggg==) 0% 50% no-repeat;">Edit links</a></span></div></div></div></div></div><div id="footer" role="contentinfo" style="margin-left: 11em; margin-top: 0px; padding: 1.25em; direction: ltr; color: rgb(0, 0, 0); font-family: sans-serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px;"><ul id="footer-info" style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none;"><li id="footer-info-lastmod" style="margin: 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; line-height: 1.4em;">This page was last modified on 10 November 2015, at 18:44.</li><li id="footer-info-copyright" style="margin: 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; line-height: 1.4em;">Text is available under the<span class="Apple-converted-space"> </span><a rel="license" href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Creative Commons Attribution-ShareAlike License</a>; additional terms may apply. By using this site, you agree to the<span class="Apple-converted-space"> </span><a href="https://wikimediafoundation.org/wiki/Terms_of_Use" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Terms of Use</a><span class="Apple-converted-space"> </span>and<span class="Apple-converted-space"> </span><a href="https://wikimediafoundation.org/wiki/Privacy_policy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Privacy Policy</a>. Wikipedia® is a registered trademark of the<span class="Apple-converted-space"> </span><a href="https://www.wikimediafoundation.org/" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Wikimedia Foundation, Inc.</a>, a non-profit organization.</li></ul><ul id="footer-places" style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none; float: left;"><li id="footer-places-privacy" style="margin: 0px 1em 0px 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em;"><a href="https://wikimediafoundation.org/wiki/Privacy_policy" title="wmf:Privacy policy" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Privacy policy</a></li><li id="footer-places-about" style="margin: 0px 1em 0px 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em;"><a href="https://en.wikipedia.org/wiki/Wikipedia:About" title="Wikipedia:About" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">About Wikipedia</a></li><li id="footer-places-disclaimer" style="margin: 0px 1em 0px 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em;"><a href="https://en.wikipedia.org/wiki/Wikipedia:General_disclaimer" title="Wikipedia:General disclaimer" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Disclaimers</a></li><li id="footer-places-contact" style="margin: 0px 1em 0px 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em;"><a href="https://en.wikipedia.org/wiki/Wikipedia:Contact_us" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Contact Wikipedia</a></li><li id="footer-places-developers" style="margin: 0px 1em 0px 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em;"><a href="https://www.mediawiki.org/wiki/Special:MyLanguage/How_to_contribute" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Developers</a></li><li id="footer-places-mobileview" style="margin: 0px 1em 0px 0px; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em;"><a href="https://en.m.wikipedia.org/w/index.php?title=Synonym&amp;mobileaction=toggle_view_mobile" class="noprint stopMobileRedirectToggle" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Mobile view</a></li></ul><ul id="footer-icons" class="noprint" style="list-style-type: none; margin: 0px; padding: 0px; list-style-image: none; float: right;"><li id="footer-copyrightico" style="margin: 0px 0px 0px 0.5em; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em; text-align: right;"><a href="https://wikimediafoundation.org/" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><img src="https://en.wikipedia.org/static/images/wikimedia-button.png" srcset="/static/images/wikimedia-button-1.5x.png 1.5x, /static/images/wikimedia-button-2x.png 2x" width="88" height="31" alt="Wikimedia Foundation" style="border: none; vertical-align: middle;"></a></li><li id="footer-poweredbyico" style="margin: 0px 0px 0px 0.5em; padding: 0.5em 0px; color: rgb(51, 51, 51); font-size: 0.7em; float: left; line-height: 2em; text-align: right;"><a href="https://www.mediawiki.org/" style="text-decoration: none; color: rgb(11, 0, 128); background: none;"><img src="https://en.wikipedia.org/static/1.27.0-wmf.7/resources/assets/poweredby_mediawiki_88x31.png" alt="Powered by MediaWiki" srcset="/static/1.27.0-wmf.7/resources/assets/poweredby_mediawiki_132x47.png 1.5x, /static/1.27.0-wmf.7/resources/assets/poweredby_mediawiki_176x62.png 2x" width="88" height="31" style="border: none; vertical-align: middle;"></a></li></ul></div>
```

## Browser / Chrome (Windows)

### Plain text:

```
<html>
<body>
<!--StartFragment--><span style="color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 12.8px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);">Obama received national</span><!--EndFragment-->
</body>
</html>
```

### Annotated text:

```
<html>
<body>
<!--StartFragment--><span style="color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 12.8px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);">during his<span class="Apple-converted-space"> </span></span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004" style="text-decoration: none; color: rgb(11, 0, 128); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 12.8px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background: none rgb(255, 255, 255);">campaign to represent Illinois</a><span style="color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: 12.8px; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; display: inline !important; float: none; background-color: rgb(255, 255, 255);"><span class="Apple-converted-space"> </span>in</span><!--EndFragment-->
</body>
</html>
```

### Two Paragraphs:

```
<html>
<body>
<!--StartFragment--><p style="margin: 0.5em 0px; line-height: 12.8px; color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">In 2004, Obama received national attention during his<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">campaign to represent Illinois</a><span class="Apple-converted-space"> </span>in the<a href="https://en.wikipedia.org/wiki/United_States_Senate" title="United States Senate" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">United States Senate</a><span class="Apple-converted-space"> </span>with his victory in the March<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Democratic_Party_(United_States)" title="Democratic Party (United States)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Democratic Party</a><span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Primary_election" title="Primary election" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">primary</a>, his<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address" title="2004 Democratic National Convention keynote address" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">keynote address</a><span class="Apple-converted-space"> </span>at the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention" title="2004 Democratic National Convention" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Democratic National Convention</a><span class="Apple-converted-space"> </span>in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008" title="Barack Obama presidential primary campaign, 2008" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">a close primary campaign</a>against<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Hillary_Clinton" title="Hillary Clinton" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Hillary Rodham Clinton</a><span class="Apple-converted-space"> </span>in 2008, he won sufficient delegates in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008" title="Democratic Party presidential primaries, 2008" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Democratic Party primaries</a><span class="Apple-converted-space"> </span>to receive the presidential nomination. He then defeated<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Republican_Party_(United_States)" title="Republican Party (United States)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Republican</a><span class="Apple-converted-space"> </span>nominee<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/John_McCain" title="John McCain" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">John McCain</a><span class="Apple-converted-space"> </span>in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008" title="United States presidential election, 2008" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">general election</a>, and was<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama" title="First inauguration of Barack Obama" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">inaugurated as president</a><span class="Apple-converted-space"> </span>on January 20, 2009. Nine months after his inauguration, Obama was named the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize" title="2009 Nobel Peace Prize" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">2009 Nobel Peace Prize</a><span class="Apple-converted-space"> </span>laureate.</p><p style="margin: 0.5em 0px; line-height: 12.8px; color: rgb(37, 37, 37); font-family: sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 1; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">During his first two years in office, Obama signed into law<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Stimulus_(economics)" title="Stimulus (economics)" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">economic stimulus</a><span class="Apple-converted-space"> </span>legislation in response to the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Great_Recession" title="Great Recession" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Great Recession</a><span class="Apple-converted-space"> </span>in the form of the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009" title="American Recovery and Reinvestment Act of 2009" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">American Recovery and Reinvestment Act of 2009</a><span class="Apple-converted-space"> </span>and the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010" title="Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</a>. Other major domestic initiatives in his first term included the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act" title="Patient Protection and Affordable Care Act" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Patient Protection and Affordable Care Act</a>, often referred to as "Obamacare"; the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act" title="Dodd–Frank Wall Street Reform and Consumer Protection Act" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Dodd–Frank Wall Street Reform and Consumer Protection Act</a>; and the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010" title="Don't Ask, Don't Tell Repeal Act of 2010" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Don't Ask, Don't Tell Repeal Act of 2010</a>. In foreign policy, Obama<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq" title="Withdrawal of U.S. troops from Iraq" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">ended U.S. military involvement</a><span class="Apple-converted-space"> </span>in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Iraq_War" title="Iraq War" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Iraq War</a>, increased U.S. troop levels in<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/War_in_Afghanistan_(2001%E2%80%93present)" title="War in Afghanistan (2001–present)" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Afghanistan</a>, signed the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/New_START" title="New START" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">New START</a><span class="Apple-converted-space"> </span>arms control treaty with<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Russia" title="Russia" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Russia</a>, ordered<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya" title="2011 military intervention in Libya" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">U.S. military involvement in Libya</a><span class="Apple-converted-space"> </span>in opposition to<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Muammar_Gaddafi" title="Muammar Gaddafi" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Muammar Gaddafi</a>, and ordered the military operation that resulted in the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden" title="Death of Osama bin Laden" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">death of Osama bin Laden</a>. In January 2011,<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010" title="United States midterm elections, 2010" class="mw-redirect" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">the Republicans regained control of the House of Representatives</a><span class="Apple-converted-space"> </span>as the Democratic Party lost a total of 63 seats; and, after a lengthy debate over federal spending and whether or not to raise the nation's<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/United_States_debt_ceiling" title="United States debt ceiling" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">debt limit</a>, Obama signed the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011" title="Budget Control Act of 2011" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">Budget Control Act of 2011</a><span class="Apple-converted-space"> </span>and the<span class="Apple-converted-space"> </span><a href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012" title="American Taxpayer Relief Act of 2012" style="text-decoration: none; color: rgb(11, 0, 128); background: none;">American Taxpayer Relief Act of 2012</a>.</p><!--EndFragment-->
</body>
</html>
```

## Browser / Firefox (Linux)

### Plain Text:

```
"Obama received national"
```

### Annotated text:

```
during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004">campaign to represent Illinois</a> in
```

### Two Paragraphs:

```
<p>In 2004, Obama received national attention during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004">campaign to represent Illinois</a> in the <a href="https://en.wikipedia.org/wiki/United_States_Senate" title="United States Senate">United States Senate</a> with his victory in the March <a href="https://en.wikipedia.org/wiki/Democratic_Party_%28United_States%29" title="Democratic Party (United States)">Democratic Party</a> <a href="https://en.wikipedia.org/wiki/Primary_election" title="Primary election">primary</a>, his <a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address" title="2004 Democratic National Convention keynote address">keynote address</a> at the <a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention" title="2004 Democratic National Convention">Democratic National Convention</a> in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after <a href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008" title="Barack Obama presidential primary campaign, 2008">a close primary campaign</a> against <a href="https://en.wikipedia.org/wiki/Hillary_Clinton" title="Hillary Clinton">Hillary Rodham Clinton</a> in 2008, he won sufficient delegates in the <a href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008" title="Democratic Party presidential primaries, 2008">Democratic Party primaries</a> to receive the presidential nomination. He then defeated <a href="https://en.wikipedia.org/wiki/Republican_Party_%28United_States%29" title="Republican Party (United States)">Republican</a> nominee <a href="https://en.wikipedia.org/wiki/John_McCain" title="John McCain">John McCain</a> in the <a href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008" title="United States presidential election, 2008">general election</a>, and was <a href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama" title="First inauguration of Barack Obama">inaugurated as president</a> on January 20, 2009. Nine months after his inauguration, Obama was named the <a href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize" title="2009 Nobel Peace Prize">2009 Nobel Peace Prize</a> laureate.</p>
<p>During his first two years in office, Obama signed into law <a href="https://en.wikipedia.org/wiki/Stimulus_%28economics%29" title="Stimulus (economics)">economic stimulus</a> legislation in response to the <a href="https://en.wikipedia.org/wiki/Great_Recession" title="Great Recession">Great Recession</a> in the form of the <a href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009" title="American Recovery and Reinvestment Act of 2009">American Recovery and Reinvestment Act of 2009</a> and the <a href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010" title="Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</a>. Other major domestic initiatives in his first term included the <a href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act" title="Patient Protection and Affordable Care Act">Patient Protection and Affordable Care Act</a>, often referred to as "Obamacare"; the <a href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act" title="Dodd–Frank Wall Street Reform and Consumer Protection Act">Dodd–Frank Wall Street Reform and Consumer Protection Act</a>; and the <a href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010" title="Don't Ask, Don't Tell Repeal Act of 2010">Don't Ask, Don't Tell Repeal Act of 2010</a>. In foreign policy, Obama <a href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq" title="Withdrawal of U.S. troops from Iraq">ended U.S. military involvement</a> in the <a href="https://en.wikipedia.org/wiki/Iraq_War" title="Iraq War">Iraq War</a>, increased U.S. troop levels in <a href="https://en.wikipedia.org/wiki/War_in_Afghanistan_%282001%E2%80%93present%29" title="War in Afghanistan (2001–present)" class="mw-redirect">Afghanistan</a>, signed the <a href="https://en.wikipedia.org/wiki/New_START" title="New START">New START</a> arms control treaty with <a href="https://en.wikipedia.org/wiki/Russia" title="Russia">Russia</a>, ordered <a href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya" title="2011 military intervention in Libya">U.S. military involvement in Libya</a> in opposition to <a href="https://en.wikipedia.org/wiki/Muammar_Gaddafi" title="Muammar Gaddafi">Muammar Gaddafi</a>, and ordered the military operation that resulted in the <a href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden" title="Death of Osama bin Laden">death of Osama bin Laden</a>. In January 2011, <a href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010" title="United States midterm elections, 2010" class="mw-redirect">the Republicans regained control of the House of Representatives</a>
 as the Democratic Party lost a total of 63 seats; and, after a lengthy
debate over federal spending and whether or not to raise the nation's <a href="https://en.wikipedia.org/wiki/United_States_debt_ceiling" title="United States debt ceiling">debt limit</a>, Obama signed the <a href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011" title="Budget Control Act of 2011">Budget Control Act of 2011</a> and the <a href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012" title="American Taxpayer Relief Act of 2012">American Taxpayer Relief Act of 2012</a>.</p>
```

### Whole Page

```
    <div id="mw-page-base" class="noprint"></div>
    <div id="mw-head-base" class="noprint"></div>
    <div id="content" class="mw-body" role="main">
      <a id="top"></a>

              <div id="siteNotice"><div id="centralNotice"></div></div>
            <div class="mw-indicators">
</div>
      <h1 id="firstHeading" class="firstHeading" lang="en">Synonym</h1>
                  <div id="bodyContent" class="mw-body-content">
                  <div id="siteSub">From Wikipedia, the free encyclopedia</div>
                <div id="contentSub"></div>
                        </div></div>
        <div id="mw-content-text" dir="ltr" class="mw-content-ltr" lang="en"><div class="hatnote">This article is about the general meaning of "synonym".  For its use in biology, see <a href="https://en.wikipedia.org/wiki/Synonym_%28taxonomy%29" title="Synonym (taxonomy)">Synonym (taxonomy)</a>.</div>
<table class="metadata plainlinks ambox ambox-content ambox-Refimprove" role="presentation">
<tbody><tr>
<td class="mbox-image">
<div style="width:52px"><a href="https://en.wikipedia.org/wiki/File:Question_book-new.svg" class="image"><img alt="" src="https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Question_book-new.svg/50px-Question_book-new.svg.png" srcset="//upload.wikimedia.org/wikipedia/en/thumb/9/99/Question_book-new.svg/75px-Question_book-new.svg.png 1.5x, //upload.wikimedia.org/wikipedia/en/thumb/9/99/Question_book-new.svg/100px-Question_book-new.svg.png 2x" data-file-width="262" data-file-height="204" height="39" width="50"></a></div>
</td>
<td class="mbox-text"><span class="mbox-text-span">This article <b>needs additional citations for <a href="https://en.wikipedia.org/wiki/Wikipedia:Verifiability" title="Wikipedia:Verifiability">verification</a></b>. <span class="hide-when-compact">Please help <a class="external text" href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit">improve this article</a> by <a href="https://en.wikipedia.org/wiki/Help:Introduction_to_referencing/1" title="Help:Introduction to referencing/1" class="mw-redirect">adding citations to reliable sources</a>. Unsourced material may be challenged and removed.</span> <small><i>(May 2014)</i></small></span></td>
</tr>
</tbody></table>
<div class="thumb tright">
<div class="thumbinner" style="width:222px;"><a href="https://en.wikipedia.org/wiki/File:Library_of_Ashurbanipal_synonym_list_tablet.jpg" class="image"><img alt="" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Library_of_Ashurb…onym_list_tablet.jpg/220px-Library_of_Ashurbanipal_synonym_list_tablet.jpg" class="thumbimage" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/6/64/Library_of_Ashurbanipal_synonym_list_tablet.jpg/330px-Library_of_Ashurbanipal_synonym_list_tablet.jpg 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/6/64/Library_of_Ashurbanipal_synonym_list_tablet.jpg/440px-Library_of_Ashurbanipal_synonym_list_tablet.jpg 2x" data-file-width="1829" data-file-height="2676" height="322" width="220"></a>
<div class="thumbcaption">
<div class="magnify"></div></div></div></div></div><div class="thumb tright"><div class="thumbinner" style="width:222px;"><div class="thumbcaption">
Synonym list in <a href="https://en.wikipedia.org/wiki/Cuneiform" title="Cuneiform">cuneiform</a> on a clay tablet, <a href="https://en.wikipedia.org/wiki/Neo-Assyrian" title="Neo-Assyrian" class="mw-redirect">Neo-Assyrian</a> period. Ref:<a rel="nofollow" class="external text" href="http://www.britishmuseum.org/research/search_the_collection_database/search_object_details.aspx?objectid=308401&amp;partid=1">K.4375</a> .</div>
</div>
</div>
<p>A <b>synonym</b> is a word or phrase that means exactly or nearly the
 same as another word or phrase in the same language. Words that are
synonyms are said to be <b>synonymous</b>, and the state of being a synonym is called <b>synonymy</b>. The word comes from <a href="https://en.wikipedia.org/wiki/Ancient_Greek_language" title="Ancient Greek language" class="mw-redirect">Ancient Greek</a> <i>syn</i> (<span xml:lang="grc" lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%83%CF%8D%CE%BD" class="extiw" title="wikt:σύν">σύν</a></span>) ("with") and <i>onoma</i> (<span xml:lang="grc" lang="grc"><a href="https://en.wiktionary.org/wiki/%E1%BD%84%CE%BD%CE%BF%CE%BC%CE%B1" class="extiw" title="wikt:ὄνομα">ὄνομα</a></span>) ("name"). An example of synonyms are the words <i>begin</i>, <i>start</i>, and <i>commence</i>. Words can be synonymous when meant in certain <a href="https://en.wikipedia.org/wiki/Word_sense" title="Word sense">senses</a>, even if they are not synonymous in all of their senses. For example, if we talk about a <i>long time</i> or an <i>extended time</i>, <i>long</i> and <i>extended</i> are synonymous within that <a href="https://en.wikipedia.org/wiki/Context_%28language_use%29" title="Context (language use)">context</a>. Synonyms with exact interchangeability share a <a href="https://en.wikipedia.org/wiki/Seme_%28semantics%29" title="Seme (semantics)">seme</a> or denotational <a href="https://en.wikipedia.org/wiki/Sememe" title="Sememe">sememe</a>, whereas those with inexactly similar meanings share a broader denotational or connotational <a href="https://en.wikipedia.org/wiki/Sememe" title="Sememe">sememe</a> and thus overlap within a <a href="https://en.wikipedia.org/wiki/Semantic_field" title="Semantic field">semantic field</a>. Some academics call the former type <a href="https://en.wikipedia.org/wiki/Cognitive_synonymy" title="Cognitive synonymy">cognitive synonyms</a> to distinguish them from the latter type, which they call near-synonyms.<sup id="cite_ref-Stanojevi.C4.87_2009_1-0" class="reference"><a href="https://en.wikipedia.org/wiki/Synonym#cite_note-Stanojevi.C4.87_2009-1"><span>[</span>1<span>]</span></a></sup></p>
<p>In the figurative sense, two words are sometimes said to be synonymous if they have the same <a href="https://en.wikipedia.org/wiki/Connotation" title="Connotation">connotation</a>:</p>
<blockquote class="templatequote">
<p>...a widespread impression that ... <a href="https://en.wikipedia.org/wiki/Hollywood" title="Hollywood">Hollywood</a> was synonymous with immorality...<sup id="cite_ref-2" class="reference"><a href="https://en.wikipedia.org/wiki/Synonym#cite_note-2"><span>[</span>2<span>]</span></a></sup></p>
<div class="templatequotecite"><cite>— <a href="https://en.wikipedia.org/wiki/Doris_Kearns_Goodwin" title="Doris Kearns Goodwin">Doris Kearns Goodwin</a></cite></div>
</blockquote>
<p><a href="https://en.wikipedia.org/wiki/Metonymy" title="Metonymy">Metonymy</a> can sometimes be a form of synonymy, as when, for example, <i>the <a href="https://en.wikipedia.org/wiki/White_House" title="White House">White House</a></i> is used as a synonym of <i>the administration</i> in referring to the U.S. <a href="https://en.wikipedia.org/wiki/Executive_%28government%29" title="Executive (government)">executive branch</a> under a specific president. Thus a metonym is a type of synonym, and the word <i>metonym</i> is a <a href="https://en.wikipedia.org/wiki/Hyponymy_and_hypernymy" title="Hyponymy and hypernymy">hyponym</a> of the word <i>synonym</i>.</p>
<p>The analysis of synonymy, <a href="https://en.wikipedia.org/wiki/Polysemy" title="Polysemy">polysemy</a>, and <a href="https://en.wikipedia.org/wiki/Hyponymy_and_hypernymy" title="Hyponymy and hypernymy">hyponymy and hypernymy</a> is vital to <a href="https://en.wikipedia.org/wiki/Taxonomy_%28general%29" title="Taxonomy (general)">taxonomy</a> and <a href="https://en.wikipedia.org/wiki/Ontology_%28information_science%29" title="Ontology (information science)">ontology</a> in the <a href="https://en.wikipedia.org/wiki/Information_science" title="Information science">information-science</a> senses of those terms. It has applications in <a href="https://en.wikipedia.org/wiki/Pedagogy" title="Pedagogy">pedagogy</a> and <a href="https://en.wikipedia.org/wiki/Machine_learning" title="Machine learning">machine learning</a>, because they rely on <a href="https://en.wikipedia.org/wiki/Word-sense_disambiguation" title="Word-sense disambiguation">word-sense disambiguation</a> and <a href="https://en.wiktionary.org/wiki/schema#Noun" class="extiw" title="wikt:schema">schema</a>.</p>
<p></p>
<div id="toc" class="toc">
<div id="toctitle">
<h2>Contents</h2>
</div></div><div id="toc" class="toc">
<ul>
<li class="toclevel-1 tocsection-1"><a href="https://en.wikipedia.org/wiki/Synonym#Examples"><span class="tocnumber">1</span> <span class="toctext">Examples</span></a></li>
<li class="toclevel-1 tocsection-2"><a href="https://en.wikipedia.org/wiki/Synonym#Related_terms"><span class="tocnumber">2</span> <span class="toctext">Related terms</span></a></li>
<li class="toclevel-1 tocsection-3"><a href="https://en.wikipedia.org/wiki/Synonym#See_also"><span class="tocnumber">3</span> <span class="toctext">See also</span></a></li>
<li class="toclevel-1 tocsection-4"><a href="https://en.wikipedia.org/wiki/Synonym#References"><span class="tocnumber">4</span> <span class="toctext">References</span></a></li>
<li class="toclevel-1 tocsection-5"><a href="https://en.wikipedia.org/wiki/Synonym#External_links"><span class="tocnumber">5</span> <span class="toctext">External links</span></a></li>
</ul>
</div>
<p></p>
<h2><span class="mw-headline" id="Examples">Examples</span></h2>
<p>Synonyms can be any <a href="https://en.wikipedia.org/wiki/Part_of_speech" title="Part of speech">part of speech</a> (such as <a href="https://en.wikipedia.org/wiki/Noun" title="Noun">nouns</a>, <a href="https://en.wikipedia.org/wiki/Verbs" title="Verbs" class="mw-redirect">verbs</a>, <a href="https://en.wikipedia.org/wiki/Adjective" title="Adjective">adjectives</a>, <a href="https://en.wikipedia.org/wiki/Adverb" title="Adverb">adverbs</a> or <a href="https://en.wikipedia.org/wiki/Preposition" title="Preposition" class="mw-redirect">prepositions</a>), as long as both words belong to the same part of speech. Examples:</p>
<ul>
<li>verb
<ul>
<li><i>buy</i> and <i>purchase</i></li>
</ul>
</li>
<li>adjective
<ul>
<li><i>big</i> and <i>large</i></li>
</ul>
</li>
<li>adverb
<ul>
<li><i>quickly</i> and <i>speedily</i></li>
</ul>
</li>
<li>preposition
<ul>
<li><i>on</i> and <i>upon</i></li>
</ul>
</li>
</ul>
<p>Note that synonyms are defined with respect to certain senses of words; for instance, <i>pupil</i> as the <i>aperture in the iris of the eye</i> is not synonymous with <i>student</i>. Such like, <i>he expired</i> means the same as <i>he died</i>, yet <i>my passport has expired</i> cannot be replaced by <i>my passport has died</i>.</p>
<p>In English, many synonyms emerged in the <a href="https://en.wikipedia.org/wiki/Middle_Ages" title="Middle Ages">Middle Ages</a>, after the <a href="https://en.wikipedia.org/wiki/Norman_conquest_of_England" title="Norman conquest of England">Norman conquest of England</a>. While <a href="https://en.wikipedia.org/wiki/England" title="England">England</a>'s new ruling class spoke <a href="https://en.wikipedia.org/wiki/Norman_French" title="Norman French" class="mw-redirect">Norman French</a>, the lower classes continued to speak <a href="https://en.wikipedia.org/wiki/Old_English" title="Old English">Old English</a> (Anglo-Saxon). Thus, today we have synonyms like the Norman-derived <i>people</i>, <i>liberty</i> and <i>archer</i>, and the Saxon-derived <i>folk</i>, <i>freedom</i> and <i>bowman</i>. For more examples, see the <a href="https://en.wikipedia.org/wiki/List_of_Germanic_and_Latinate_equivalents_in_English" title="List of Germanic and Latinate equivalents in English">list of Germanic and Latinate equivalents in English</a>.</p>
<p>Some <a href="https://en.wikipedia.org/wiki/Lexicographer" title="Lexicographer" class="mw-redirect">lexicographers</a> claim that no synonyms have exactly the same meaning (in all contexts or social levels of language) because <a href="https://en.wikipedia.org/wiki/Etymology" title="Etymology">etymology</a>, <a href="https://en.wikipedia.org/wiki/Orthography" title="Orthography">orthography</a>,
 phonic qualities, ambiguous meanings, usage, etc. make them unique.
Different words that are similar in meaning usually differ for a reason:
 <i>feline</i> is more formal than <i>cat</i>; <i>long</i> and <i>extended</i> are only synonyms in one usage and not in others (for example, a <i>long arm</i> is not the same as an <i>extended arm</i>). Synonyms are also a source of <a href="https://en.wikipedia.org/wiki/Euphemism" title="Euphemism">euphemisms</a>.</p>
<p>The purpose of a <a href="https://en.wikipedia.org/wiki/Thesaurus" title="Thesaurus">thesaurus</a> is to offer the user a listing of similar or related words; these are often, but not always, synonyms.</p>
<h2><span class="mw-headline" id="Related_terms">Related terms</span></h2>
<ul>
<li>The word <i><b>poecilonym</b></i> is a rare synonym of the word <i>synonym</i>. It is not entered in most major dictionaries and is a curiosity or piece of trivia for being an <a href="https://en.wikipedia.org/wiki/Autological_word" title="Autological word">autological word</a> because of its <a href="https://en.wikipedia.org/wiki/Meta" title="Meta">meta</a> quality as a synonym of <i>synonym</i>.</li>
<li><b><a href="https://en.wikipedia.org/wiki/Antonym" title="Antonym" class="mw-redirect">Antonyms</a></b> are words with opposite or nearly opposite meanings. For example: <i>hot</i> ↔ <i>cold</i>, <i>large</i> ↔ <i>small</i>, <i>thick</i> ↔ <i>thin</i>, <i>synonym</i> ↔ <i>antonym</i></li>
<li><b><a href="https://en.wikipedia.org/wiki/Hypernym" title="Hypernym" class="mw-redirect">Hypernyms</a></b> and <b><a href="https://en.wikipedia.org/wiki/Hyponym" title="Hyponym" class="mw-redirect">hyponyms</a></b> are words that refer to, respectively, a general category and a specific instance of that category. For example, <i>vehicle</i> is a hypernym of <i>car</i>, and <i>car</i> is a hyponym of <i>vehicle</i>.</li>
<li><b><a href="https://en.wikipedia.org/wiki/Homophone" title="Homophone">Homophones</a></b> are words that have the same pronunciation, but different meanings. For example, <i>witch</i> and <i>which</i> are homophones in most accents (because they are pronounced the same).</li>
<li><b><a href="https://en.wikipedia.org/wiki/Homograph" title="Homograph">Homographs</a></b> are words that have the same spelling, but have different pronunciations. For example, one can <i>record</i> a song or keep a <i>record</i> of documents.</li>
<li><b><a href="https://en.wikipedia.org/wiki/Homonym" title="Homonym">Homonyms</a></b> are words that have the same pronunciation and spelling, but have different meanings. For example, <i>rose</i> (a type of flower) and <i>rose</i> (past tense of <i>rise</i>) are homonyms.</li>
</ul>
<h2><span class="mw-headline" id="See_also">See also</span></h2>
<ul>
<li><a href="https://en.wikipedia.org/wiki/-onym" title="-onym">-onym</a></li>
<li><a href="https://en.wikipedia.org/wiki/Synonym_ring" title="Synonym ring">Synonym ring</a></li>
<li><a href="https://en.wikipedia.org/wiki/Cognitive_synonymy" title="Cognitive synonymy">Cognitive synonymy</a></li>
<li><a href="https://en.wikipedia.org/wiki/Elegant_variation" title="Elegant variation">Elegant variation</a>, the gratuitous use of a synonym in prose</li>
</ul>
<h2><span class="mw-headline" id="References">References</span></h2>
<div class="reflist" style="list-style-type: decimal;">
<ol class="references">
<li id="cite_note-Stanojevi.C4.87_2009-1"></li></ol></div><li id="cite_note-Stanojevi.C4.87_2009-1"> <span class="reference-text"><cite id="CITEREFStanojevi.C4.872009" class="citation">Stanojević, Maja (2009), <a rel="nofollow" class="external text" href="http://facta.junis.ni.ac.rs/lal/lal200902/lal200902-05.pdf">"Cognitive synonymy: a general overview"</a> <span style="font-size:85%;">(PDF)</span>, <i>Facta Universitatis, Linguistics and Literature series</i> <b>7</b> (2): 193–200.</cite><span title="ctx_ver=Z39.88-2004&amp;rfr_id=info%3Asid%2Fen.wikipedia.org%3ASynonym&amp;rft.atitle=Cognitive+synonymy%3A+a+general+overview&amp;rft.aufirst=Maja&amp;rft.aulast=Stanojevi%C4%87&amp;rft.date=2009&amp;rft.genre=article&amp;rft_id=http%3A%2F%2Ffacta.junis.ni.ac.rs%2Flal%2Flal200902%2Flal200902-05.pdf&amp;rft.issue=2&amp;rft.jtitle=Facta+Universitatis%2C+Linguistics+and+Literature+series&amp;rft.pages=193-200&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;rft.volume=7" class="Z3988"></span></span></li>
<li id="cite_note-2"></li><div class="reflist" style="list-style-type: decimal;"><ol class="references"><li value="2" id="cite_note-2"> <span class="reference-text"><cite class="citation book"><a rel="nofollow" class="external text" href="http://books.google.com/books?id=bGSSl9I4maEC&amp;pg=PA370&amp;dq=a+widespr…n%20that...%20Hollywood%20was%20synonymous%20with%20immorality&amp;f=false"><i>The Fitzgeralds and the Kennedys</i></a>. Macmillan. 1991. p. 370. <a href="https://en.wikipedia.org/wiki/International_Standard_Book_Number" title="International Standard Book Number">ISBN</a> <a href="https://en.wikipedia.org/wiki/Special:BookSources/9780312063542" title="Special:BookSources/9780312063542">9780312063542</a><span class="reference-accessdate">. Retrieved <span class="nowrap">2014-05-27</span></span>.</cite><span title="ctx_ver=Z39.88-2004&amp;rfr_id=info%3Asid%2Fen.wikipedia.org%3ASynonym&amp;rft.btitle=The+Fitzgeralds+and+the+Kennedys&amp;rft.date=1991&amp;rft.genre=book&amp;rft_id=http%3A%2F%2Fbooks.google.com%2Fbooks%3Fid%3DbGSSl9I4maEC%26pg%3DPA370%26dq%3Da%2Bwidespread%2Bimpression%2Bthat...%2BHollywood%2Bwas%2Bsynonymous%2Bwith%2Bimmorality%26hl%3Den%26sa%3DX%26ei%3DIRSEU7roL--_sQSb7IGgCA%26ved%3D0CCsQ6AEwAA%23v%3Donepage%26q%3Da%2520widespread%2520impression%2520that...%2520Hollywood%2520was%2520synonymous%2520with%2520immorality%26f%3Dfalse&amp;rft.isbn=9780312063542&amp;rft.pages=370&amp;rft.pub=Macmillan&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook" class="Z3988"></span></span></li>
</ol>
</div>
<h2><span class="mw-headline" id="External_links">External links</span></h2><div id="content" class="mw-body" role="main"><div id="bodyContent" class="mw-body-content"><div id="mw-content-text" dir="ltr" class="mw-content-ltr" lang="en">
<table class="mbox-small plainlinks sistersitebox" style="border:1px solid #aaa;background-color:#f9f9f9">
<tbody><tr>
<td class="mbox-image"><img alt="" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wiktionary-logo-en.svg/37px-Wiktionary-logo-en.svg.png" srcset="//upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wiktionary-logo-en.svg/55px-Wiktionary-logo-en.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Wiktionary-logo-en.svg/73px-Wiktionary-logo-en.svg.png 2x" data-file-width="1000" data-file-height="1089" height="40" width="37"></td>
<td class="mbox-text plainlist">Look up <i><b><a href="https://en.wiktionary.org/wiki/Special:Search/synonym" class="extiw" title="wiktionary:Special:Search/synonym">synonym</a></b></i> in Wiktionary, the free dictionary.</td>
</tr>
</tbody></table>
<p>Tools which graph words relations :</p>
<ul>
<li><a rel="nofollow" class="external text" href="http://graphwords.com/">Graph Words</a> - Online tool for visualization word relations</li>
<li><a rel="nofollow" class="external text" href="http://www.synonyms.net/">Synonyms.net</a>
 - Online reference resource that provides instant synonyms and antonyms
 definitions including visualizations, voice pronunciations and
translations</li>
<li><a rel="nofollow" class="external text" href="http://dico.isc.cnrs.fr/en/index.html">English/French Semantic Atlas</a>
 - Graph words relations in English, French and gives cross
representations for translations - offers 500 searches per user per day.</li>
</ul>
<p>Plain words synonyms finder :</p>
<ul>
<li><a rel="nofollow" class="external text" href="http://www.synonym-finder.com/">Synonym Finder</a> - Synonym finder including hypernyms in search result</li>
<li><a rel="nofollow" class="external text" href="http://www.how-to-say.net">how to say</a> - Online Synonym finder</li>
<li><a rel="nofollow" class="external text" href="http://synonymosum.com/">Synonymosum</a> - Online Synonym Dictionary - words and their synonyms</li>
<li><a rel="nofollow" class="external text" href="http://trovami.altervista.org/sinonimi/en">Thesaurus</a> - Online synonyms in English, Italian, French and German</li>
<li><a rel="nofollow" class="external text" href="http://synonyms.woxikon.com/">Woxikon Synonyms</a> - Over 1 million synonyms - English, German, Spanish, French, Italian, Portuguese, Swedish and Dutch</li>
<li><a rel="nofollow" class="external text" href="http://www.thefreedictionary.com/">Freedictionary.com</a> Free online English thesaurus and dictionary containing synonyms, related words, antonyms, definitions, idioms and more</li>
<li><a rel="nofollow" class="external text" href="http://www.powerthesaurus.org/">Power Thesaurus</a> - Thesaurus with synonyms ordered by rating</li>
<li><a rel="nofollow" class="external text" href="http://www.findmewords.com/synonyms.html">FindMeWords Synonyms</a> - Online Synonym Dictionary with definitions</li>
</ul>
<table class="navbox" style="border-spacing:0">
<tbody><tr>
<td style="padding:2px">
<table id="collapsibleTable0" class="nowraplinks collapsible autocollapse navbox-inner" style="border-spacing:0;background:transparent;color:inherit">
<tbody><tr>
<th scope="col" class="navbox-title" colspan="2"><span class="collapseButton">[<a href="https://en.wikipedia.org/wiki/Synonym#" id="collapseButton0">hide</a>]</span>
<div class="plainlinks hlist navbar mini">
<ul>
<li class="nv-view"><a href="https://en.wikipedia.org/wiki/Template:Lexicology" title="Template:Lexicology"><abbr title="View this template" style=";;background:none transparent;border:none;">v</abbr></a></li>
<li class="nv-talk"><a href="https://en.wikipedia.org/wiki/Template_talk:Lexicology" title="Template talk:Lexicology"><abbr title="Discuss this template" style=";;background:none transparent;border:none;">t</abbr></a></li>
<li class="nv-edit"><a class="external text" href="https://en.wikipedia.org/w/index.php?title=Template:Lexicology&amp;action=edit"><abbr title="Edit this template" style=";;background:none transparent;border:none;">e</abbr></a></li>
</ul>
</div>
<div style="font-size:114%"><a href="https://en.wikipedia.org/wiki/Lexicology" title="Lexicology">Lexicology</a></div>
</th>
</tr>
<tr style="height:2px">
<td colspan="2"></td>
</tr>
<tr>
<th scope="row" class="navbox-group">Major terms</th>
<td class="navbox-list navbox-odd hlist" style="text-align:left;border-left-width:2px;border-left-style:solid;width:100%;padding:0px">
<div style="padding:0em 0.25em">
<ul>
<li><a href="https://en.wikipedia.org/wiki/Lexical_item" title="Lexical item">Lexical item</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lexicon" title="Lexicon">Lexicon</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lexis_%28linguistics%29" title="Lexis (linguistics)">Lexis</a></li>
<li><a href="https://en.wikipedia.org/wiki/Word" title="Word">Word</a></li>
</ul>
</div>
</td>
</tr>
<tr style="height:2px">
<td colspan="2"></td>
</tr>
<tr>
<th scope="row" class="navbox-group">Elements</th>
<td class="navbox-list navbox-even hlist" style="text-align:left;border-left-width:2px;border-left-style:solid;width:100%;padding:0px">
<div style="padding:0em 0.25em">
<ul>
<li><a href="https://en.wikipedia.org/wiki/Cherology" title="Cherology">Chereme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Glyph" title="Glyph">Glyphs</a></li>
<li><a href="https://en.wikipedia.org/wiki/Grapheme" title="Grapheme">Grapheme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lemma_%28psycholinguistics%29" title="Lemma (psycholinguistics)">Lemma</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lexeme" title="Lexeme">Lexeme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Meronymy" title="Meronymy">Meronymy</a></li>
<li><a href="https://en.wikipedia.org/wiki/Morpheme" title="Morpheme">Morpheme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Phoneme" title="Phoneme">Phoneme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Seme_%28semantics%29" title="Seme (semantics)">Seme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Sememe" title="Sememe">Sememe</a></li>
</ul>
</div>
</td>
</tr>
<tr style="height:2px">
<td colspan="2"></td>
</tr>
<tr>
<th scope="row" class="navbox-group"><a href="https://en.wikipedia.org/wiki/Semantics" title="Semantics">Semantic relations</a></th>
<td class="navbox-list navbox-odd hlist" style="text-align:left;border-left-width:2px;border-left-style:solid;width:100%;padding:0px">
<div style="padding:0em 0.25em">
<ul>
<li><a href="https://en.wikipedia.org/wiki/Opposite_%28semantics%29" title="Opposite (semantics)">Antonymy</a></li>
<li><a href="https://en.wikipedia.org/wiki/Holonymy" title="Holonymy">Holonymy</a></li>
<li><a href="https://en.wikipedia.org/wiki/Hyponymy_and_hypernymy" title="Hyponymy and hypernymy">Hyponymy and hypernymy</a></li>
<li><a href="https://en.wikipedia.org/wiki/Idiom" title="Idiom">Idiom</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lexical_semantics" title="Lexical semantics">Lexical semantics</a></li>
<li><a href="https://en.wikipedia.org/wiki/Semantic_network" title="Semantic network">Semantic network</a></li>
<li><strong class="selflink">Synonym</strong></li>
<li><a href="https://en.wikipedia.org/wiki/Troponymy" title="Troponymy">Troponymy</a></li>
</ul>
</div>
</td>
</tr>
<tr style="height:2px">
<td colspan="2"></td>
</tr>
<tr>
<th scope="row" class="navbox-group">Functions</th>
<td class="navbox-list navbox-even hlist" style="text-align:left;border-left-width:2px;border-left-style:solid;width:100%;padding:0px">
<div style="padding:0em 0.25em">
<ul>
<li><a href="https://en.wikipedia.org/wiki/Function_word" title="Function word">Function word</a></li>
<li><a href="https://en.wikipedia.org/wiki/Headword" title="Headword">Headword</a></li>
</ul>
</div>
</td>
</tr>
<tr style="height:2px">
<td colspan="2"></td>
</tr>
<tr>
<th scope="row" class="navbox-group">Fields</th>
<td class="navbox-list navbox-odd hlist" style="text-align:left;border-left-width:2px;border-left-style:solid;width:100%;padding:0px">
<div style="padding:0em 0.25em">
<ul>
<li><a href="https://en.wikipedia.org/wiki/Controlled_vocabulary" title="Controlled vocabulary">Controlled vocabulary</a></li>
<li><a href="https://en.wikipedia.org/wiki/English_lexicology_and_lexicography" title="English lexicology and lexicography">English lexicology and lexicography</a></li>
<li><a href="https://en.wikipedia.org/wiki/International_scientific_vocabulary" title="International scientific vocabulary">International scientific vocabulary</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lexicographic_error" title="Lexicographic error">Lexicographic error</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lexicographic_information_cost" title="Lexicographic information cost">Lexicographic information cost</a></li>
<li><a href="https://en.wikipedia.org/wiki/Linguistic_prescription" title="Linguistic prescription">Linguistic prescription</a></li>
<li><a href="https://en.wikipedia.org/wiki/Morphology_%28linguistics%29" title="Morphology (linguistics)">Morphology</a></li>
<li><a href="https://en.wikipedia.org/wiki/Specialised_lexicography" title="Specialised lexicography">Specialised lexicography</a></li>
</ul>
</div>
</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>
<table class="navbox" style="border-spacing:0">
<tbody><tr>
<td style="padding:2px">
<table class="nowraplinks hlist navbox-inner" style="border-spacing:0;background:transparent;color:inherit">
<tbody><tr>
<th scope="row" class="navbox-group"><a href="https://en.wikipedia.org/wiki/Help:Authority_control" title="Help:Authority control">Authority control</a></th>
<td class="navbox-list navbox-odd" style="text-align:left;border-left-width:2px;border-left-style:solid;width:100%;padding:0px">
<div style="padding:0em 0.25em">
<ul>
<li><a href="https://en.wikipedia.org/wiki/Library_of_Congress_Control_Number" title="Library of Congress Control Number">LCCN</a>: <span class="uid"><a rel="nofollow" class="external text" href="http://id.loc.gov/authorities/subjects/sh85131642">sh85131642</a></span></li>
<li><a href="https://en.wikipedia.org/wiki/Integrated_Authority_File" title="Integrated Authority File">GND</a>: <span class="uid"><a rel="nofollow" class="external text" href="http://d-nb.info/gnd/4058765-4">4058765-4</a></span></li>
</ul>
</div>
</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>







</div>
        <div id="catlinks" class="catlinks"><div id="mw-normal-catlinks" class="mw-normal-catlinks"><a href="https://en.wikipedia.org/wiki/Help:Category" title="Help:Category">Categories</a>: <ul><li><a href="https://en.wikipedia.org/wiki/Category:Lexical_semantics" title="Category:Lexical semantics">Lexical semantics</a></li><li><a href="https://en.wikipedia.org/wiki/Category:Types_of_words" title="Category:Types of words">Types of words</a></li></ul></div></div>        <div class="visualClear"></div>
              </div>
    </div>
    <div id="mw-navigation">
      <h2>Navigation menu</h2>

      <div id="mw-head">
                  <div id="p-personal" role="navigation" class="" aria-labelledby="p-personal-label">

            <ul>
              <li id="pt-createaccount"><a href="https://en.wikipedia.org/w/index.php?title=Special:UserLogin&amp;returnto=Synonym&amp;type=signup" title="You are encouraged to create an account and log in; however, it is not mandatory">Create account</a></li><li id="pt-userpage"><span style="color: gray;">Not logged in</span></li><li id="pt-mytalk"><a accesskey="n" title="Your talk page [Alt+Shift+n]" href="https://en.wikipedia.org/wiki/Special:MyTalk">Talk</a></li><li id="pt-mycontris"><a accesskey="y" title="A list of your contributions [Alt+Shift+y]" href="https://en.wikipedia.org/wiki/Special:MyContributions">Contributions</a></li><li id="pt-login"><a href="https://en.wikipedia.org/w/index.php?title=Special:UserLogin&amp;returnto=Synonym" title="You're encouraged to log in; however, it's not mandatory. [Alt+Shift+o]" accesskey="o">Log in</a></li>            </ul>
          </div>
                  <div id="left-navigation">
                    <div id="p-namespaces" role="navigation" class="vectorTabs" aria-labelledby="p-namespaces-label">

            <ul>
                              <li id="ca-nstab-main" class="selected"><span><a href="https://en.wikipedia.org/wiki/Synonym" title="View the content page [Alt+Shift+c]" accesskey="c">Article</a></span></li>
                              <li id="ca-talk"><span><a href="https://en.wikipedia.org/wiki/Talk:Synonym" title="Discussion about the content page [Alt+Shift+t]" accesskey="t" rel="discussion">Talk</a></span></li>
                          </ul>
          </div>

                  </div>
        <div id="right-navigation">
                    <div id="p-views" role="navigation" class="vectorTabs" aria-labelledby="p-views-label">

            <ul>
                              <li id="ca-view" class="selected"><span><a href="https://en.wikipedia.org/wiki/Synonym">Read</a></span></li>
                              <li id="ca-edit"><span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=edit" title="Edit this page [Alt+Shift+e]" accesskey="e">Edit</a></span></li>
                              <li id="ca-history" class="collapsible"><span><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=history" title="Past revisions of this page [Alt+Shift+h]" accesskey="h">View history</a></span></li>
                          </ul>
          </div>

                    <div id="p-search" role="search">


            <form action="/w/index.php" id="searchform">
              <div id="simpleSearch">
              <input autocomplete="off" tabindex="1" name="search" placeholder="Search" title="Search Wikipedia [Alt+Shift+f]" accesskey="f" id="searchInput" type="search"></div></form></div></div></div></div><div id="mw-navigation"><div id="mw-head"><div id="right-navigation"><div id="p-search" role="search"><form action="/w/index.php" id="searchform"><div id="simpleSearch">              </div>
            </form>
          </div>
                  </div>
      </div>
      <div id="mw-panel">
        <div id="p-logo" role="banner"><a class="mw-wiki-logo" href="https://en.wikipedia.org/wiki/Main_Page" title="Visit the main page"></a></div>
            <div class="portal" role="navigation" id="p-navigation" aria-labelledby="p-navigation-label">


      <div class="body">
                  <ul>
            <li id="n-mainpage-description"><a href="https://en.wikipedia.org/wiki/Main_Page" title="Visit the main page [Alt+Shift+z]" accesskey="z">Main page</a></li><li id="n-contents"><a href="https://en.wikipedia.org/wiki/Portal:Contents" title="Guides to browsing Wikipedia">Contents</a></li><li id="n-featuredcontent"><a href="https://en.wikipedia.org/wiki/Portal:Featured_content" title="Featured content – the best of Wikipedia">Featured content</a></li><li id="n-currentevents"><a href="https://en.wikipedia.org/wiki/Portal:Current_events" title="Find background information on current events">Current events</a></li><li id="n-randompage"><a href="https://en.wikipedia.org/wiki/Special:Random" title="Load a random article [Alt+Shift+x]" accesskey="x">Random article</a></li><li id="n-sitesupport"><a href="https://donate.wikimedia.org/wiki/Special:FundraiserRedirector?utm_source=d…mp;utm_medium=sidebar&amp;utm_campaign=C13_en.wikipedia.org&amp;uselang=en" title="Support us">Donate to Wikipedia</a></li><li id="n-shoplink"><a href="https://shop.wikimedia.org" title="Visit the Wikipedia store">Wikipedia store</a></li>          </ul>
              </div>
    </div>
      <div class="portal" role="navigation" id="p-interaction" aria-labelledby="p-interaction-label">
      <h3 id="p-interaction-label">Interaction</h3>

      <div class="body">
                  <ul>
            <li id="n-help"><a href="https://en.wikipedia.org/wiki/Help:Contents" title="Guidance on how to use and edit Wikipedia">Help</a></li><li id="n-aboutsite"><a href="https://en.wikipedia.org/wiki/Wikipedia:About" title="Find out about Wikipedia">About Wikipedia</a></li><li id="n-portal"><a href="https://en.wikipedia.org/wiki/Wikipedia:Community_portal" title="About the project, what you can do, where to find things">Community portal</a></li><li id="n-recentchanges"><a href="https://en.wikipedia.org/wiki/Special:RecentChanges" title="A list of recent changes in the wiki [Alt+Shift+r]" accesskey="r">Recent changes</a></li><li id="n-contactpage"><a href="https://en.wikipedia.org/wiki/Wikipedia:Contact_us" title="How to contact Wikipedia">Contact page</a></li>          </ul>
              </div>
    </div>
      <div class="portal" role="navigation" id="p-tb" aria-labelledby="p-tb-label">
      <h3 id="p-tb-label">Tools</h3>

      <div class="body">
                  <ul>
            <li id="t-whatlinkshere"><a href="https://en.wikipedia.org/wiki/Special:WhatLinksHere/Synonym" title="List of all English Wikipedia pages containing links to this page [Alt+Shift+j]" accesskey="j">What links here</a></li><li id="t-recentchangeslinked"><a href="https://en.wikipedia.org/wiki/Special:RecentChangesLinked/Synonym" title="Recent changes in pages linked from this page [Alt+Shift+k]" accesskey="k">Related changes</a></li><li id="t-upload"><a href="https://en.wikipedia.org/wiki/Wikipedia:File_Upload_Wizard" title="Upload files [Alt+Shift+u]" accesskey="u">Upload file</a></li><li id="t-specialpages"><a href="https://en.wikipedia.org/wiki/Special:SpecialPages" title="A list of all special pages [Alt+Shift+q]" accesskey="q">Special pages</a></li><li id="t-permalink"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;oldid=690006505" title="Permanent link to this revision of the page">Permanent link</a></li><li id="t-info"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;action=info" title="More information about this page">Page information</a></li><li id="t-wikibase"><a href="https://www.wikidata.org/wiki/Q42106" title="Link to connected data repository item [Alt+Shift+g]" accesskey="g">Wikidata item</a></li><li id="t-cite"><a href="https://en.wikipedia.org/w/index.php?title=Special:CiteThisPage&amp;page=Synonym&amp;id=690006505" title="Information on how to cite this page">Cite this page</a></li>          </ul>
              </div>
    </div>
      <div class="portal" role="navigation" id="p-coll-print_export" aria-labelledby="p-coll-print_export-label">
      <h3 id="p-coll-print_export-label">Print/export</h3>

      <div class="body">
                  <ul>
            <li id="coll-create_a_book"><a href="https://en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=book_creator&amp;referer=Synonym">Create a book</a></li><li id="coll-download-as-rdf2latex"><a href="https://en.wikipedia.org/w/index.php?title=Special:Book&amp;bookcmd=render_…itle=Synonym&amp;returnto=Synonym&amp;oldid=690006505&amp;writer=rdf2latex">Download as PDF</a></li><li id="t-print"><a href="https://en.wikipedia.org/w/index.php?title=Synonym&amp;printable=yes" title="Printable version of this page [Alt+Shift+p]" accesskey="p">Printable version</a></li>          </ul>
              </div>
    </div>
      <div class="portal" role="navigation" id="p-lang" aria-labelledby="p-lang-label"><span aria-haspopup="true" role="button" tabindex="0" title="Language settings" class="uls-settings-trigger"></span>
      <h3 id="p-lang-label">Languages</h3>

      <div class="body">
                  <ul>
            <li class="interlanguage-link interwiki-af"><a href="https://af.wikipedia.org/wiki/Sinoniem" title="Sinoniem – Afrikaans" hreflang="af" lang="af">Afrikaans</a></li><li class="interlanguage-link interwiki-ar"><a href="https://ar.wikipedia.org/wiki/%D8%AA%D8%B1%D8%A7%D8%AF%D9%81" title="ترادف – Arabic" hreflang="ar" lang="ar">العربية</a></li><li class="interlanguage-link interwiki-az"><a href="https://az.wikipedia.org/wiki/Sinoniml%C9%99r" title="Sinonimlər – Azerbaijani" hreflang="az" lang="az">Azərbaycanca</a></li><li class="interlanguage-link interwiki-be"><a href="https://be.wikipedia.org/wiki/%D0%A1%D1%96%D0%BD%D0%BE%D0%BD%D1%96%D0%BC%D1%8B" title="Сінонімы – Belarusian" hreflang="be" lang="be">Беларуская</a></li><li class="interlanguage-link interwiki-be-x-old"><a href="https://be-x-old.wikipedia.org/wiki/%D0%A1%D1%8B%D0%BD%D0%BE%D0%BD%D1%96%D0%BC%D1%8B" title="Сынонімы – беларуская (тарашкевіца)‎" hreflang="be-x-old" lang="be-x-old">Беларуская (тарашкевіца)‎</a></li><li class="interlanguage-link interwiki-bg"><a href="https://bg.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Bulgarian" hreflang="bg" lang="bg">Български</a></li><li class="interlanguage-link interwiki-bar"><a href="https://bar.wikipedia.org/wiki/Synonym" title="Synonym – Bavarian" hreflang="bar" lang="bar">Boarisch</a></li><li class="interlanguage-link interwiki-ca"><a href="https://ca.wikipedia.org/wiki/Sin%C3%B2nim" title="Sinònim – Catalan" hreflang="ca" lang="ca">Català</a></li><li class="interlanguage-link interwiki-cv"><a href="https://cv.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC%D1%81%D0%B5%D0%BC" title="Синонимсем – Chuvash" hreflang="cv" lang="cv">Чӑвашла</a></li><li class="interlanguage-link interwiki-cs"><a href="https://cs.wikipedia.org/wiki/Synonymum" title="Synonymum – Czech" hreflang="cs" lang="cs">Čeština</a></li><li class="interlanguage-link interwiki-cy"><a href="https://cy.wikipedia.org/wiki/Cyfystyr" title="Cyfystyr – Welsh" hreflang="cy" lang="cy">Cymraeg</a></li><li class="interlanguage-link interwiki-da"><a href="https://da.wikipedia.org/wiki/Synonym" title="Synonym – Danish" hreflang="da" lang="da">Dansk</a></li><li class="interlanguage-link interwiki-de"><a href="https://de.wikipedia.org/wiki/Synonym" title="Synonym – German" hreflang="de" lang="de">Deutsch</a></li><li class="interlanguage-link interwiki-et"><a href="https://et.wikipedia.org/wiki/S%C3%BCnon%C3%BC%C3%BCm" title="Sünonüüm – Estonian" hreflang="et" lang="et">Eesti</a></li><li class="interlanguage-link interwiki-el"><a href="https://el.wikipedia.org/wiki/%CE%A3%CF%85%CE%BD%CF%8E%CE%BD%CF%85%CE%BC%CE%BF" title="Συνώνυμο – Greek" hreflang="el" lang="el">Ελληνικά</a></li><li class="interlanguage-link interwiki-es"><a href="https://es.wikipedia.org/wiki/Sinonimia_%28sem%C3%A1ntica%29" title="Sinonimia (semántica) – Spanish" hreflang="es" lang="es">Español</a></li><li class="interlanguage-link interwiki-eo"><a href="https://eo.wikipedia.org/wiki/Sinonimo" title="Sinonimo – Esperanto" hreflang="eo" lang="eo">Esperanto</a></li><li class="interlanguage-link interwiki-eu"><a href="https://eu.wikipedia.org/wiki/Sinonimo" title="Sinonimo – Basque" hreflang="eu" lang="eu">Euskara</a></li><li class="interlanguage-link interwiki-fa"><a href="https://fa.wikipedia.org/wiki/%D9%85%D8%AA%D8%B1%D8%A7%D8%AF%D9%81" title="مترادف – Persian" hreflang="fa" lang="fa">فارسی</a></li><li class="interlanguage-link interwiki-fo"><a href="https://fo.wikipedia.org/wiki/Samheiti" title="Samheiti – Faroese" hreflang="fo" lang="fo">Føroyskt</a></li><li class="interlanguage-link interwiki-fr"><a href="https://fr.wikipedia.org/wiki/Synonymie" title="Synonymie – French" hreflang="fr" lang="fr">Français</a></li><li class="interlanguage-link interwiki-ga"><a href="https://ga.wikipedia.org/wiki/Comhchiallach" title="Comhchiallach – Irish" hreflang="ga" lang="ga">Gaeilge</a></li><li class="interlanguage-link interwiki-gl"><a href="https://gl.wikipedia.org/wiki/Sinonimia" title="Sinonimia – Galician" hreflang="gl" lang="gl">Galego</a></li><li class="interlanguage-link interwiki-ko"><a href="https://ko.wikipedia.org/wiki/%EB%8F%99%EC%9D%98%EC%96%B4" title="동의어 – Korean" hreflang="ko" lang="ko">한국어</a></li><li class="interlanguage-link interwiki-hy"><a href="https://hy.wikipedia.org/wiki/%D5%80%D5%B8%D5%B4%D5%A1%D5%B6%D5%AB%D5%B7" title="Հոմանիշ – Armenian" hreflang="hy" lang="hy">Հայերեն</a></li><li class="interlanguage-link interwiki-hi"><a href="https://hi.wikipedia.org/wiki/%E0%A4%AA%E0%A4%B0%E0%A5%8D%E0%A4%AF%E0%A4%BE%E0%A4%AF%E0%A4%B5%E0%A4%BE%E0%A4%9A%E0%A5%80" title="पर्यायवाची – Hindi" hreflang="hi" lang="hi">हिन्दी</a></li><li class="interlanguage-link interwiki-hr"><a href="https://hr.wikipedia.org/wiki/Sinonim" title="Sinonim – Croatian" hreflang="hr" lang="hr">Hrvatski</a></li><li class="interlanguage-link interwiki-io"><a href="https://io.wikipedia.org/wiki/Sinonimo" title="Sinonimo – Ido" hreflang="io" lang="io">Ido</a></li><li class="interlanguage-link interwiki-id"><a href="https://id.wikipedia.org/wiki/Sinonim" title="Sinonim – Indonesian" hreflang="id" lang="id">Bahasa Indonesia</a></li><li class="interlanguage-link interwiki-ia"><a href="https://ia.wikipedia.org/wiki/Synonymo" title="Synonymo – Interlingua" hreflang="ia" lang="ia">Interlingua</a></li><li class="interlanguage-link interwiki-is"><a href="https://is.wikipedia.org/wiki/Samheiti" title="Samheiti – Icelandic" hreflang="is" lang="is">Íslenska</a></li><li class="interlanguage-link interwiki-it"><a href="https://it.wikipedia.org/wiki/Sinonimia" title="Sinonimia – Italian" hreflang="it" lang="it">Italiano</a></li><li class="interlanguage-link interwiki-he"><a href="https://he.wikipedia.org/wiki/%D7%9E%D7%99%D7%9C%D7%94_%D7%A0%D7%A8%D7%93%D7%A4%D7%AA" title="מילה נרדפת – Hebrew" hreflang="he" lang="he">עברית</a></li><li class="interlanguage-link interwiki-jv"><a href="https://jv.wikipedia.org/wiki/Dasanama" title="Dasanama – Javanese" hreflang="jv" lang="jv">Basa Jawa</a></li><li class="interlanguage-link interwiki-ka"><a href="https://ka.wikipedia.org/wiki/%E1%83%A1%E1%83%98%E1%83%9C%E1%83%9D%E1%83%9C%E1%83%98%E1%83%9B%E1%83%94%E1%83%91%E1%83%98" title="სინონიმები – Georgian" hreflang="ka" lang="ka">ქართული</a></li><li class="interlanguage-link interwiki-kk"><a href="https://kk.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Kazakh" hreflang="kk" lang="kk">Қазақша</a></li><li class="interlanguage-link interwiki-ku"><a href="https://ku.wikipedia.org/wiki/Hevwate" title="Hevwate – Kurdish" hreflang="ku" lang="ku">Kurdî</a></li><li class="interlanguage-link interwiki-la"><a href="https://la.wikipedia.org/wiki/Synonymia" title="Synonymia – Latin" hreflang="la" lang="la">Latina</a></li><li class="interlanguage-link interwiki-lv"><a href="https://lv.wikipedia.org/wiki/Sinon%C4%ABms" title="Sinonīms – Latvian" hreflang="lv" lang="lv">Latviešu</a></li><li class="interlanguage-link interwiki-lb"><a href="https://lb.wikipedia.org/wiki/Synonymie" title="Synonymie – Luxembourgish" hreflang="lb" lang="lb">Lëtzebuergesch</a></li><li class="interlanguage-link interwiki-lt"><a href="https://lt.wikipedia.org/wiki/Sinonimas" title="Sinonimas – Lithuanian" hreflang="lt" lang="lt">Lietuvių</a></li><li class="interlanguage-link interwiki-hu"><a href="https://hu.wikipedia.org/wiki/Szinon%C3%ADmia" title="Szinonímia – Hungarian" hreflang="hu" lang="hu">Magyar</a></li><li class="interlanguage-link interwiki-mk"><a href="https://mk.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Macedonian" hreflang="mk" lang="mk">Македонски</a></li><li class="interlanguage-link interwiki-ml"><a href="https://ml.wikipedia.org/wiki/%E0%B4%AA%E0%B4%B0%E0%B5%8D%E0%B4%AF%E0%B4%BE%E0%B4%AF%E0%B4%AA%E0%B4%A6%E0%B4%82" title="പര്യായപദം – Malayalam" hreflang="ml" lang="ml">മലയാളം</a></li><li class="interlanguage-link interwiki-ms"><a href="https://ms.wikipedia.org/wiki/Sinonim" title="Sinonim – Malay" hreflang="ms" lang="ms">Bahasa Melayu</a></li><li class="interlanguage-link interwiki-nl"><a href="https://nl.wikipedia.org/wiki/Synoniem_%28taalkunde%29" title="Synoniem (taalkunde) – Dutch" hreflang="nl" lang="nl">Nederlands</a></li><li class="interlanguage-link interwiki-ja"><a href="https://ja.wikipedia.org/wiki/%E9%A1%9E%E7%BE%A9%E8%AA%9E" title="類義語 – Japanese" hreflang="ja" lang="ja">日本語</a></li><li class="interlanguage-link interwiki-ce"><a href="https://ce.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC%D0%B0%D1%88" title="Синонимаш – Chechen" hreflang="ce" lang="ce">Нохчийн</a></li><li class="interlanguage-link interwiki-no"><a href="https://no.wikipedia.org/wiki/Synonym" title="Synonym – Norwegian" hreflang="no" lang="no">Norsk bokmål</a></li><li class="interlanguage-link interwiki-nn"><a href="https://nn.wikipedia.org/wiki/Synonym" title="Synonym – Norwegian Nynorsk" hreflang="nn" lang="nn">Norsk nynorsk</a></li><li class="interlanguage-link interwiki-uz"><a href="https://uz.wikipedia.org/wiki/Sinonimlar" title="Sinonimlar – Uzbek" hreflang="uz" lang="uz">Oʻzbekcha/ўзбекча</a></li><li class="interlanguage-link interwiki-pfl"><a href="https://pfl.wikipedia.org/wiki/Wort:Synonyme" title="Wort:Synonyme – Palatine German" hreflang="pfl" lang="pfl">Pälzisch</a></li><li class="interlanguage-link interwiki-pl"><a href="https://pl.wikipedia.org/wiki/Synonim" title="Synonim – Polish" hreflang="pl" lang="pl">Polski</a></li><li class="interlanguage-link interwiki-pt"><a href="https://pt.wikipedia.org/wiki/Sin%C3%B4nimo" title="Sinônimo – Portuguese" hreflang="pt" lang="pt">Português</a></li><li class="interlanguage-link interwiki-ro"><a href="https://ro.wikipedia.org/wiki/Sinonim" title="Sinonim – Romanian" hreflang="ro" lang="ro">Română</a></li><li class="interlanguage-link interwiki-qu"><a href="https://qu.wikipedia.org/wiki/Kaqlla_simi" title="Kaqlla simi – Quechua" hreflang="qu" lang="qu">Runa Simi</a></li><li class="interlanguage-link interwiki-ru"><a href="https://ru.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC%D1%8B" title="Синонимы – Russian" hreflang="ru" lang="ru">Русский</a></li><li class="interlanguage-link interwiki-sco"><a href="https://sco.wikipedia.org/wiki/Synonym" title="Synonym – Scots" hreflang="sco" lang="sco">Scots</a></li><li class="interlanguage-link interwiki-sq"><a href="https://sq.wikipedia.org/wiki/Sinonimi" title="Sinonimi – Albanian" hreflang="sq" lang="sq">Shqip</a></li><li class="interlanguage-link interwiki-simple"><a href="https://simple.wikipedia.org/wiki/Synonym" title="Synonym – Simple English" hreflang="simple" lang="simple">Simple English</a></li><li class="interlanguage-link interwiki-sk"><a href="https://sk.wikipedia.org/wiki/Synonymum" title="Synonymum – Slovak" hreflang="sk" lang="sk">Slovenčina</a></li><li class="interlanguage-link interwiki-sl"><a href="https://sl.wikipedia.org/wiki/Sopomenka" title="Sopomenka – Slovenian" hreflang="sl" lang="sl">Slovenščina</a></li><li class="interlanguage-link interwiki-sr"><a href="https://sr.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Serbian" hreflang="sr" lang="sr">Српски / srpski</a></li><li class="interlanguage-link interwiki-sh"><a href="https://sh.wikipedia.org/wiki/Sinonim" title="Sinonim – Serbo-Croatian" hreflang="sh" lang="sh">Srpskohrvatski / српскохрватски</a></li><li class="interlanguage-link interwiki-su"><a href="https://su.wikipedia.org/wiki/Sinonim" title="Sinonim – Sundanese" hreflang="su" lang="su">Basa Sunda</a></li><li class="interlanguage-link interwiki-fi"><a href="https://fi.wikipedia.org/wiki/Synonymia" title="Synonymia – Finnish" hreflang="fi" lang="fi">Suomi</a></li><li class="interlanguage-link interwiki-sv"><a href="https://sv.wikipedia.org/wiki/Synonym" title="Synonym – Swedish" hreflang="sv" lang="sv">Svenska</a></li><li class="interlanguage-link interwiki-ta"><a href="https://ta.wikipedia.org/wiki/%E0%AE%92%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AE%9A%E0%AF%8A%E0%AE%B2%E0%AF%8D" title="ஒத்தசொல் – Tamil" hreflang="ta" lang="ta">தமிழ்</a></li><li class="interlanguage-link interwiki-tt"><a href="https://tt.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D0%B8%D0%BC" title="Синоним – Tatar" hreflang="tt" lang="tt">Татарча/tatarça</a></li><li class="interlanguage-link interwiki-te"><a href="https://te.wikipedia.org/wiki/%E0%B0%AA%E0%B0%B0%E0%B1%8D%E0%B0%AF%E0%B0%BE%E0%B0%AF%E0%B0%AA%E0%B0%A6%E0%B0%82" title="పర్యాయపదం – Telugu" hreflang="te" lang="te">తెలుగు</a></li><li class="interlanguage-link interwiki-tr"><a href="https://tr.wikipedia.org/wiki/E%C5%9Fanlaml%C4%B1" title="Eşanlamlı – Turkish" hreflang="tr" lang="tr">Türkçe</a></li><li class="interlanguage-link interwiki-uk"><a href="https://uk.wikipedia.org/wiki/%D0%A1%D0%B8%D0%BD%D0%BE%D0%BD%D1%96%D0%BC" title="Синонім – Ukrainian" hreflang="uk" lang="uk">Українська</a></li><li class="interlanguage-link interwiki-ur"><a href="https://ur.wikipedia.org/wiki/%D9%85%D8%AA%D8%B1%D8%A7%D8%AF%D9%81" title="مترادف – Urdu" hreflang="ur" lang="ur">اردو</a></li><li class="interlanguage-link interwiki-vi"><a href="https://vi.wikipedia.org/wiki/T%E1%BB%AB_%C4%91%E1%BB%93ng_ngh%C4%A9a" title="Từ đồng nghĩa – Vietnamese" hreflang="vi" lang="vi">Tiếng Việt</a></li><li class="interlanguage-link interwiki-wa"><a href="https://wa.wikipedia.org/wiki/Sinonimeye" title="Sinonimeye – Walloon" hreflang="wa" lang="wa">Walon</a></li><li class="interlanguage-link interwiki-zh-yue"><a href="https://zh-yue.wikipedia.org/wiki/%E5%90%8C%E7%BE%A9%E8%A9%9E" title="同義詞 – Cantonese" hreflang="zh-yue" lang="zh-yue">粵語</a></li><li class="interlanguage-link interwiki-zh"><a href="https://zh.wikipedia.org/wiki/%E5%90%8C%E4%B9%89%E8%AF%8D" title="同义词 – Chinese" hreflang="zh" lang="zh">中文</a></li>          </ul>
        <div class="after-portlet after-portlet-lang"><span class="wb-langlinks-edit wb-langlinks-link"><a href="https://www.wikidata.org/wiki/Q42106#sitelinks-wikipedia" title="Edit interlanguage links" class="wbc-editpage">Edit links</a></span></div>      </div>
    </div>
        </div>
    </div>
    <div id="footer" role="contentinfo">
              <ul id="footer-info">
                      <li id="footer-info-lastmod"> This page was last modified on 10 November 2015, at 18:44.</li>
                      <li id="footer-info-copyright">Text is available under the <a rel="license" href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License">Creative Commons Attribution-ShareAlike License</a>;
additional terms may apply.  By using this site, you agree to the <a href="https://wikimediafoundation.org/wiki/Terms_of_Use">Terms of Use</a> and <a href="https://wikimediafoundation.org/wiki/Privacy_policy">Privacy Policy</a>. Wikipedia® is a registered trademark of the <a href="https://www.wikimediafoundation.org/">Wikimedia Foundation, Inc.</a>, a non-profit organization.</li>
                  </ul>
              <ul id="footer-places">
                      <li id="footer-places-privacy"><a href="https://wikimediafoundation.org/wiki/Privacy_policy" title="wmf:Privacy policy">Privacy policy</a></li>
                      <li id="footer-places-about"><a href="https://en.wikipedia.org/wiki/Wikipedia:About" title="Wikipedia:About">About Wikipedia</a></li>
                      <li id="footer-places-disclaimer"><a href="https://en.wikipedia.org/wiki/Wikipedia:General_disclaimer" title="Wikipedia:General disclaimer">Disclaimers</a></li>
                      <li id="footer-places-contact"><a href="https://en.wikipedia.org/wiki/Wikipedia:Contact_us">Contact Wikipedia</a></li>
                      <li id="footer-places-developers"><a href="https://www.mediawiki.org/wiki/Special:MyLanguage/How_to_contribute">Developers</a></li>
                      <li id="footer-places-mobileview"><a href="https://en.m.wikipedia.org/w/index.php?title=Synonym&amp;mobileaction=toggle_view_mobile" class="noprint stopMobileRedirectToggle">Mobile view</a></li>
                  </ul>
                    <ul id="footer-icons" class="noprint">
                      <li id="footer-copyrightico">
              <a href="https://wikimediafoundation.org/"><img src="https://en.wikipedia.org/static/images/wikimedia-button.png" srcset="/static/images/wikimedia-button-1.5x.png 1.5x, /static/images/wikimedia-button-2x.png 2x" alt="Wikimedia Foundation" height="31" width="88"></a>            </li>
                      <li id="footer-poweredbyico">
              <a href="https://www.mediawiki.org/"><img src="https://en.wikipedia.org/static/1.27.0-wmf.7/resources/assets/poweredby_mediawiki_88x31.png" alt="Powered by MediaWiki" srcset="/static/1.27.0-wmf.7/resources/assets/poweredby_mediawiki_132x47.png 1.5x, /static/1.27.0-wmf.7/resources/assets/poweredby_mediawiki_176x62.png 2x" height="31" width="88"></a>            </li>
                  </ul>
            <div style="clear:both"></div>
    </div>
```

## Browser / Firefox (OSX)

### Plain Text:

```
<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body>Obama received national</body></html>
```

### Annotated text:

```
<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body>during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004">campaign to represent Illinois</a> in </body></html>
```

### Two Paragraphs:

```
<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body><p>In 2004, Obama received national attention during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004">campaign to represent Illinois</a> in the <a href="https://en.wikipedia.org/wiki/United_States_Senate" title="United States Senate">United States Senate</a> with his victory in the March <a href="https://en.wikipedia.org/wiki/Democratic_Party_%28United_States%29" title="Democratic Party (United States)">Democratic Party</a> <a href="https://en.wikipedia.org/wiki/Primary_election" title="Primary election">primary</a>, his <a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address" title="2004 Democratic National Convention keynote address">keynote address</a> at the <a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention" title="2004 Democratic National Convention">Democratic National Convention</a> in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after <a href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008" title="Barack Obama presidential primary campaign, 2008">a close primary campaign</a> against <a href="https://en.wikipedia.org/wiki/Hillary_Clinton" title="Hillary Clinton">Hillary Rodham Clinton</a> in 2008, he won sufficient delegates in the <a href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008" title="Democratic Party presidential primaries, 2008">Democratic Party primaries</a> to receive the presidential nomination. He then defeated <a href="https://en.wikipedia.org/wiki/Republican_Party_%28United_States%29" title="Republican Party (United States)">Republican</a> nominee <a href="https://en.wikipedia.org/wiki/John_McCain" title="John McCain">John McCain</a> in the <a href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008" title="United States presidential election, 2008">general election</a>, and was <a href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama" title="First inauguration of Barack Obama">inaugurated as president</a> on January 20, 2009. Nine months after his inauguration, Obama was named the <a href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize" title="2009 Nobel Peace Prize">2009 Nobel Peace Prize</a> laureate.</p>
<p>During his first two years in office, Obama signed into law <a href="https://en.wikipedia.org/wiki/Stimulus_%28economics%29" title="Stimulus (economics)">economic stimulus</a> legislation in response to the <a href="https://en.wikipedia.org/wiki/Great_Recession" title="Great Recession">Great Recession</a> in the form of the <a href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009" title="American Recovery and Reinvestment Act of 2009">American Recovery and Reinvestment Act of 2009</a> and the <a href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010" title="Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</a>. Other major domestic initiatives in his first term included the <a href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act" title="Patient Protection and Affordable Care Act">Patient Protection and Affordable Care Act</a>, often referred to as "Obamacare"; the <a href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act" title="Dodd–Frank Wall Street Reform and Consumer Protection Act">Dodd–Frank Wall Street Reform and Consumer Protection Act</a>; and the <a href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010" title="Don't Ask, Don't Tell Repeal Act of 2010">Don't Ask, Don't Tell Repeal Act of 2010</a>. In foreign policy, Obama <a href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq" title="Withdrawal of U.S. troops from Iraq">ended U.S. military involvement</a> in the <a href="https://en.wikipedia.org/wiki/Iraq_War" title="Iraq War">Iraq War</a>, increased U.S. troop levels in <a href="https://en.wikipedia.org/wiki/War_in_Afghanistan_%282001%E2%80%93present%29" title="War in Afghanistan (2001–present)" class="mw-redirect">Afghanistan</a>, signed the <a href="https://en.wikipedia.org/wiki/New_START" title="New START">New START</a> arms control treaty with <a href="https://en.wikipedia.org/wiki/Russia" title="Russia">Russia</a>, ordered <a href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya" title="2011 military intervention in Libya">U.S. military involvement in Libya</a> in opposition to <a href="https://en.wikipedia.org/wiki/Muammar_Gaddafi" title="Muammar Gaddafi">Muammar Gaddafi</a>, and ordered the military operation that resulted in the <a href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden" title="Death of Osama bin Laden">death of Osama bin Laden</a>. In January 2011, <a href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010" title="United States midterm elections, 2010" class="mw-redirect">the Republicans regained control of the House of Representatives</a>
 as the Democratic Party lost a total of 63 seats; and, after a lengthy
debate over federal spending and whether or not to raise the nation's <a href="https://en.wikipedia.org/wiki/United_States_debt_ceiling" title="United States debt ceiling">debt limit</a>, Obama signed the <a href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011" title="Budget Control Act of 2011">Budget Control Act of 2011</a> and the <a href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012" title="American Taxpayer Relief Act of 2012">American Taxpayer Relief Act of 2012</a>.</p></body></html>
```

## Browser / Firefox (Windows)

### Plain Text:

```
<html><body>
<!--StartFragment-->Obama received national<!--EndFragment-->
</body>
</html>
```

### Annotated text:

```
<html><body>
<!--StartFragment-->during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004">campaign to represent Illinois</a> in<!--EndFragment-->
</body>
</html>
```

### Two Paragraphs:

```
<html><body>
<!--StartFragment--><p>In 2004, Obama received national attention during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" title="United States Senate election in Illinois, 2004">campaign to represent Illinois</a> in the <a href="https://en.wikipedia.org/wiki/United_States_Senate" title="United States Senate">United States Senate</a> with his victory in the March <a href="https://en.wikipedia.org/wiki/Democratic_Party_%28United_States%29" title="Democratic Party (United States)">Democratic Party</a> <a href="https://en.wikipedia.org/wiki/Primary_election" title="Primary election">primary</a>, his <a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address" title="2004 Democratic National Convention keynote address">keynote address</a> at the <a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention" title="2004 Democratic National Convention">Democratic National Convention</a> in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after <a href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008" title="Barack Obama presidential primary campaign, 2008">a close primary campaign</a> against <a href="https://en.wikipedia.org/wiki/Hillary_Clinton" title="Hillary Clinton">Hillary Rodham Clinton</a> in 2008, he won sufficient delegates in the <a href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008" title="Democratic Party presidential primaries, 2008">Democratic Party primaries</a> to receive the presidential nomination. He then defeated <a href="https://en.wikipedia.org/wiki/Republican_Party_%28United_States%29" title="Republican Party (United States)">Republican</a> nominee <a href="https://en.wikipedia.org/wiki/John_McCain" title="John McCain">John McCain</a> in the <a href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008" title="United States presidential election, 2008">general election</a>, and was <a href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama" title="First inauguration of Barack Obama">inaugurated as president</a> on January 20, 2009. Nine months after his inauguration, Obama was named the <a href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize" title="2009 Nobel Peace Prize">2009 Nobel Peace Prize</a> laureate.</p>
<p>During his first two years in office, Obama signed into law <a href="https://en.wikipedia.org/wiki/Stimulus_%28economics%29" title="Stimulus (economics)">economic stimulus</a> legislation in response to the <a href="https://en.wikipedia.org/wiki/Great_Recession" title="Great Recession">Great Recession</a> in the form of the <a href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009" title="American Recovery and Reinvestment Act of 2009">American Recovery and Reinvestment Act of 2009</a> and the <a href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010" title="Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</a>. Other major domestic initiatives in his first term included the <a href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act" title="Patient Protection and Affordable Care Act">Patient Protection and Affordable Care Act</a>, often referred to as "Obamacare"; the <a href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act" title="Dodd–Frank Wall Street Reform and Consumer Protection Act">Dodd–Frank Wall Street Reform and Consumer Protection Act</a>; and the <a href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010" title="Don't Ask, Don't Tell Repeal Act of 2010">Don't Ask, Don't Tell Repeal Act of 2010</a>. In foreign policy, Obama <a href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq" title="Withdrawal of U.S. troops from Iraq">ended U.S. military involvement</a> in the <a href="https://en.wikipedia.org/wiki/Iraq_War" title="Iraq War">Iraq War</a>, increased U.S. troop levels in <a href="https://en.wikipedia.org/wiki/War_in_Afghanistan_%282001%E2%80%93present%29" title="War in Afghanistan (2001–present)" class="mw-redirect">Afghanistan</a>, signed the <a href="https://en.wikipedia.org/wiki/New_START" title="New START">New START</a> arms control treaty with <a href="https://en.wikipedia.org/wiki/Russia" title="Russia">Russia</a>, ordered <a href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya" title="2011 military intervention in Libya">U.S. military involvement in Libya</a> in opposition to <a href="https://en.wikipedia.org/wiki/Muammar_Gaddafi" title="Muammar Gaddafi">Muammar Gaddafi</a>, and ordered the military operation that resulted in the <a href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden" title="Death of Osama bin Laden">death of Osama bin Laden</a>. In January 2011, <a href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010" title="United States midterm elections, 2010" class="mw-redirect">the Republicans regained control of the House of Representatives</a>
 as the Democratic Party lost a total of 63 seats; and, after a lengthy
debate over federal spending and whether or not to raise the nation's <a href="https://en.wikipedia.org/wiki/United_States_debt_ceiling" title="United States debt ceiling">debt limit</a>, Obama signed the <a href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011" title="Budget Control Act of 2011">Budget Control Act of 2011</a> and the <a href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012" title="American Taxpayer Relief Act of 2012">American Taxpayer Relief Act of 2012</a>.</p><!--EndFragment-->
</body>
</html>
```

## Browser / Edge (Windows)

### Plain Text:

```
<HTML class="client-js ve-not-available" lang="en" dir="ltr"><HEAD> <TITLE>Barack Obama - Wikipedia, the free encyclopedia</TITLE>
</HEAD><BODY class="mediawiki ltr sitedir-ltr ns-0 ns-subject page-Barack_Obama skin-vector action-view"><DIV class="mw-body" id="content" role="main"><DIV class="mw-body-content" id="bodyContent"><DIV class="mw-content-ltr" id="mw-content-text" lang="en" dir="ltr"><P><!--StartFragment-->Obama received national <!--EndFragment--></P></DIV></DIV></DIV></BODY></HTML>
```

### Annotated text:

```
<HTML class="client-js ve-not-available" lang="en" dir="ltr"><HEAD> <TITLE>Barack Obama - Wikipedia, the free encyclopedia</TITLE>
</HEAD><BODY class="mediawiki ltr sitedir-ltr ns-0 ns-subject page-Barack_Obama skin-vector action-view"><DIV class="mw-body" id="content" role="main"><DIV class="mw-body-content" id="bodyContent"><DIV class="mw-content-ltr" id="mw-content-text" lang="en" dir="ltr"><P><!--StartFragment-->during his <A title="United States Senate election in Illinois, 2004" href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004">campaign to represent Illinois</A> in <!--EndFragment--></P></DIV></DIV></DIV></BODY></HTML>
```

### Two Paragraphs:

```
<HTML class="client-js ve-not-available" lang="en" dir="ltr"><HEAD> <TITLE>Barack Obama - Wikipedia, the free encyclopedia</TITLE>
</HEAD><BODY class="mediawiki ltr sitedir-ltr ns-0 ns-subject page-Barack_Obama skin-vector action-view"><DIV class="mw-body" id="content" role="main"><DIV class="mw-body-content" id="bodyContent"><DIV class="mw-content-ltr" id="mw-content-text" lang="en" dir="ltr"><!--StartFragment--><P>In 2004, Obama received national attention during his <A title="United States Senate election in Illinois, 2004" href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004">campaign to represent Illinois</A> in the <A title="United States Senate" href="https://en.wikipedia.org/wiki/United_States_Senate">United States Senate</A> with his victory in the March <A title="Democratic Party (United States)" href="https://en.wikipedia.org/wiki/Democratic_Party_(United_States)">Democratic Party</A> <A title="Primary election" href="https://en.wikipedia.org/wiki/Primary_election">primary</A>, his <A title="2004 Democratic National Convention keynote address" href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address">keynote address</A> at the <A title="2004 Democratic National Convention" href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention">Democratic National Convention</A> in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after <A title="Barack Obama presidential primary campaign, 2008" href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008">a close primary campaign</A> against <A title="Hillary Clinton" href="https://en.wikipedia.org/wiki/Hillary_Clinton">Hillary Rodham Clinton</A> in 2008, he won sufficient delegates in the <A title="Democratic Party presidential primaries, 2008" href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008">Democratic Party primaries</A> to receive the presidential nomination. He then defeated <A title="Republican Party (United States)" href="https://en.wikipedia.org/wiki/Republican_Party_(United_States)">Republican</A> nominee <A title="John McCain" href="https://en.wikipedia.org/wiki/John_McCain">John McCain</A> in the <A title="United States presidential election, 2008" href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008">general election</A>, and was <A title="First inauguration of Barack Obama" href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama">inaugurated as president</A> on January 20, 2009. Nine months after his inauguration, Obama was named the <A title="2009 Nobel Peace Prize" href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize">2009 Nobel Peace Prize</A> laureate.</P><P>During his first two years in office, Obama signed into law <A title="Stimulus (economics)" href="https://en.wikipedia.org/wiki/Stimulus_(economics)">economic stimulus</A> legislation in response to the <A title="Great Recession" href="https://en.wikipedia.org/wiki/Great_Recession">Great Recession</A> in the form of the <A title="American Recovery and Reinvestment Act of 2009" href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009">American Recovery and Reinvestment Act of 2009</A> and the <A title="Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010" href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</A>. Other major domestic initiatives in his first term included the <A title="Patient Protection and Affordable Care Act" href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act">Patient Protection and Affordable Care Act</A>, often referred to as "Obamacare"; the <A title="Dodd–Frank Wall Street Reform and Consumer Protection Act" href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act">Dodd–Frank Wall Street Reform and Consumer Protection Act</A>; and the <A title="Don't Ask, Don't Tell Repeal Act of 2010" href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010">Don't Ask, Don't Tell Repeal Act of 2010</A>. In foreign policy, Obama <A title="Withdrawal of U.S. troops from Iraq" href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq">ended U.S. military involvement</A> in the <A title="Iraq War" href="https://en.wikipedia.org/wiki/Iraq_War">Iraq War</A>, increased U.S. troop levels in <A title="War in Afghanistan (2001–present)" class="mw-redirect" href="https://en.wikipedia.org/wiki/War_in_Afghanistan_(2001%E2%80%93present)">Afghanistan</A>, signed the <A title="New START" href="https://en.wikipedia.org/wiki/New_START">New START</A> arms control treaty with <A title="Russia" href="https://en.wikipedia.org/wiki/Russia">Russia</A>, ordered <A title="2011 military intervention in Libya" href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya">U.S. military involvement in Libya</A> in opposition to <A title="Muammar Gaddafi" href="https://en.wikipedia.org/wiki/Muammar_Gaddafi">Muammar Gaddafi</A>, and ordered the military operation that resulted in the <A title="Death of Osama bin Laden" href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden">death of Osama bin Laden</A>. In January 2011, <A title="United States midterm elections, 2010" class="mw-redirect" href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010">the Republicans regained control of the House of Representatives</A> as the Democratic Party lost a total of 63 seats; and, after a lengthy debate over federal spending and whether or not to raise the nation's <A title="United States debt ceiling" href="https://en.wikipedia.org/wiki/United_States_debt_ceiling">debt limit</A>, Obama signed the <A title="Budget Control Act of 2011" href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011">Budget Control Act of 2011</A> and the <A title="American Taxpayer Relief Act of 2012" href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012">American Taxpayer Relief Act of 2012</A>.</P><!--EndFragment--></DIV></DIV></DIV></BODY></HTML>
```

## Google Docs / Chrome (OSX / Linux)

The only difference between Linux and OSX is the `meta` tag (see above Browser / Chrome (OSX / Linux)).

### Plain Text:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-5bea85da-43d8-f5c6-8657-4da8de7325c0"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Obama received national</span></b>
```

### Annotated text:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-5bea85da-43db-ac2a-ad43-e477b9e4cca9"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">during his </span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">campaign to represent Illinois</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in</span></b>
```

### Two Paragraphs:

```
<meta http-equiv="content-type" content="text/html; charset=utf-8"><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-5bea85da-43dc-fb06-e327-00c1c6576cf7"><p dir="ltr" style="line-height:1.8327272415161155;margin-top:6pt;margin-bottom:6pt;"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">In 2004, Obama received national attention during his </span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">campaign to represent Illinois</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in the </span><a href="https://en.wikipedia.org/wiki/United_States_Senate" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">United States Senate</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> with his victory in the March </span><a href="https://en.wikipedia.org/wiki/Democratic_Party_(United_States)" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Democratic Party</span></a><a href="https://en.wikipedia.org/wiki/Primary_election" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">primary</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, his </span><a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">keynote address</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> at the </span><a href="https://en.wikipedia.org/wiki/2004_Democratic_National_Convention" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Democratic National Convention</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in July, and his election to the Senate in November. He began his presidential campaign in 2007 and, after </span><a href="https://en.wikipedia.org/wiki/Barack_Obama_presidential_primary_campaign,_2008" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">a close primary campaign</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> against </span><a href="https://en.wikipedia.org/wiki/Hillary_Clinton" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Hillary Rodham Clinton</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in 2008, he won sufficient delegates in the </span><a href="https://en.wikipedia.org/wiki/Democratic_Party_presidential_primaries,_2008" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Democratic Party primaries</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> to receive the presidential nomination. He then defeated </span><a href="https://en.wikipedia.org/wiki/Republican_Party_(United_States)" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Republican</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> nominee </span><a href="https://en.wikipedia.org/wiki/John_McCain" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">John McCain</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in the </span><a href="https://en.wikipedia.org/wiki/United_States_presidential_election,_2008" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">general election</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, and was </span><a href="https://en.wikipedia.org/wiki/First_inauguration_of_Barack_Obama" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">inaugurated as president</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> on January 20, 2009. Nine months after his inauguration, Obama was named the </span><a href="https://en.wikipedia.org/wiki/2009_Nobel_Peace_Prize" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">2009 Nobel Peace Prize</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> laureate.</span></p><p dir="ltr" style="line-height:1.8327272415161155;margin-top:6pt;margin-bottom:6pt;"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">During his first two years in office, Obama signed into law </span><a href="https://en.wikipedia.org/wiki/Stimulus_(economics)" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">economic stimulus</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> legislation in response to the </span><a href="https://en.wikipedia.org/wiki/Great_Recession" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Great Recession</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in the form of the </span><a href="https://en.wikipedia.org/wiki/American_Recovery_and_Reinvestment_Act_of_2009" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">American Recovery and Reinvestment Act of 2009</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> and the </span><a href="https://en.wikipedia.org/wiki/Tax_Relief,_Unemployment_Insurance_Reauthorization,_and_Job_Creation_Act_of_2010" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Tax Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">. Other major domestic initiatives in his first term included the </span><a href="https://en.wikipedia.org/wiki/Patient_Protection_and_Affordable_Care_Act" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Patient Protection and Affordable Care Act</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, often referred to as &quot;Obamacare&quot;; the </span><a href="https://en.wikipedia.org/wiki/Dodd%E2%80%93Frank_Wall_Street_Reform_and_Consumer_Protection_Act" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Dodd–Frank Wall Street Reform and Consumer Protection Act</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">; and the </span><a href="https://en.wikipedia.org/wiki/Don%27t_Ask,_Don%27t_Tell_Repeal_Act_of_2010" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Don't Ask, Don't Tell Repeal Act of 2010</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">. In foreign policy, Obama </span><a href="https://en.wikipedia.org/wiki/Withdrawal_of_U.S._troops_from_Iraq" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">ended U.S. military involvement</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in the </span><a href="https://en.wikipedia.org/wiki/Iraq_War" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Iraq War</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, increased U.S. troop levels in</span><a href="https://en.wikipedia.org/wiki/War_in_Afghanistan_(2001%E2%80%93present)" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Afghanistan</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, signed the </span><a href="https://en.wikipedia.org/wiki/New_START" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">New START</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> arms control treaty with </span><a href="https://en.wikipedia.org/wiki/Russia" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Russia</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, ordered </span><a href="https://en.wikipedia.org/wiki/2011_military_intervention_in_Libya" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">U.S. military involvement in Libya</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> in opposition to </span><a href="https://en.wikipedia.org/wiki/Muammar_Gaddafi" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Muammar Gaddafi</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, and ordered the military operation that resulted in the </span><a href="https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">death of Osama bin Laden</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">. In January 2011, </span><a href="https://en.wikipedia.org/wiki/United_States_midterm_elections,_2010" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">the Republicans regained control of the House of Representatives</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> as the Democratic Party lost a total of 63 seats; and, after a lengthy debate over federal spending and whether or not to raise the nation's </span><a href="https://en.wikipedia.org/wiki/United_States_debt_ceiling" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">debt limit</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">, Obama signed the</span><a href="https://en.wikipedia.org/wiki/Budget_Control_Act_of_2011" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Budget Control Act of 2011</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;"> and the </span><a href="https://en.wikipedia.org/wiki/American_Taxpayer_Relief_Act_of_2012" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">American Taxpayer Relief Act of 2012</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">.</span></p></b><br class="Apple-interchange-newline">
```

## Google Docs / Firefox (OSX / Linux)

As with the behavior of FF under OSX in general, FF under OSX puts a full document into the clipboard, under Linux only fragments.
Beyond that, under OSX the `body` element contains the very same fragments as served under Linux

### Plain Text:

OSX:

```
<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body><meta charset="utf-8"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;" id="docs-internal-guid-e0b4b2ba-4421-0487-8eea-908ebdaae584">Obama received national</span></body></html>
```

Linux:

```
<meta charset="utf-8"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;" id="docs-internal-guid-af43648c-43e0-a996-6b08-68384b28b868">Obama received national</span>
```

### Annotated text:

```
<meta charset="utf-8"><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;" id="docs-internal-guid-af43648c-43e2-b6e6-7296-c5f0e1288023">during his </span><a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004" style="text-decoration:none;"><span style="font-size:14px;font-family:Arial;color:#0b0080;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;">campaign to represent Illinois</span></a><span style="font-size:14px;font-family:Arial;color:#252525;background-color:#ffffff;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;"> in</span>
```

## Libre Office (OSX / Linux)

### Plain Text

```
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
  <title></title>
  <meta name="generator" content="LibreOffice 5.0.3.2 (MacOSX)"/>
  <style type="text/css">
    @page { margin: 0.79in }
    p { margin-bottom: 0.08in }
    a:link { so-language: zxx }
  </style>
</head>
<body lang="en" dir="ltr">
<p style="margin-bottom: 0in">Obama received national</p>
</body>
</html>
```

### Annotated Text

```
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
  <title></title>
  <meta name="generator" content="LibreOffice 5.0.3.2 (MacOSX)"/>
  <style type="text/css">
    @page { margin: 0.79in }
    p { margin-bottom: 0.08in }
    a:link { so-language: zxx }
  </style>
</head>
<body lang="en" dir="ltr">
<p style="margin-bottom: 0in">during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004">campaign
to represent Illinois</a> in</p>
</body>
</html>
```

### Two Paragraphs:

```
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
  <title></title>
  <meta name="generator" content="LibreOffice 5.0.3.2 (MacOSX)"/>
  <style type="text/css">
    @page { margin: 0.79in }
    p { margin-bottom: 0.08in }
    a:link { so-language: zxx }
  </style>
</head>
<body lang="en" dir="ltr">
<p style="margin-bottom: 0in">In 2004, Obama received national
attention during his <a href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004">campaign
to represent Illinois</a> in the United States Senate with his
victory in the March Democratic Party primary, his keynote address at
the Democratic National Convention in July, and his election to the
Senate in November. He began his presidential campaign in 2007 and,
after a close primary campaign against Hillary Rodham Clinton in
2008, he won sufficient delegates in the Democratic Party primaries
to receive the presidential nomination. He then defeated Republican
nominee John McCain in the general election, and was inaugurated as
president on January 20, 2009. Nine months after his inauguration,
Obama was named the 2009 Nobel Peace Prize laureate.</p>
<p style="margin-bottom: 0in"><br/>

</p>
<p style="margin-bottom: 0in">During his first two years in office,
Obama signed into law economic stimulus legislation in response to
the Great Recession in the form of the American Recovery and
Reinvestment Act of 2009 and the Tax Relief, Unemployment Insurance
Reauthorization, and Job Creation Act of 2010. Other major domestic
initiatives in his first term included the Patient Protection and
Affordable Care Act, often referred to as &quot;Obamacare&quot;; the
Dodd–Frank Wall Street Reform and Consumer Protection Act; and the
Don't Ask, Don't Tell Repeal Act of 2010. In foreign policy, Obama
ended U.S. military involvement in the Iraq War, increased U.S. troop
levels in Afghanistan, signed the New START arms control treaty with
Russia, ordered U.S. military involvement in Libya in opposition to
Muammar Gaddafi, and ordered the military operation that resulted in
the death of Osama bin Laden. In January 2011, the Republicans
regained control of the House of Representatives as the Democratic
Party lost a total of 63 seats; and, after a lengthy debate over
federal spending and whether or not to raise the nation's debt limit,
Obama signed the Budget Control Act of 2011 and the American Taxpayer
Relief Act of 2012.</p>
</body>
</html>
```

## Microsoft Word 11 OSX

### Plain Text

```
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">

<head>
<meta name=Title content="">
<meta name=Keywords content="">
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 14">
<meta name=Originator content="Microsoft Word 14">
<link rel=File-List
href="file://localhost/Users/oliver/Library/Caches/TemporaryItems/msoclip/0clip_filelist.xml">
<!--[if gte mso 9]><xml>
 <o:DocumentProperties>
  <o:Revision>0</o:Revision>
  <o:TotalTime>0</o:TotalTime>
  <o:Pages>1</o:Pages>
  <o:Words>3</o:Words>
  <o:Characters>22</o:Characters>
  <o:Company>Company</o:Company>
  <o:Lines>1</o:Lines>
  <o:Paragraphs>1</o:Paragraphs>
  <o:CharactersWithSpaces>24</o:CharactersWithSpaces>
  <o:Version>14.0</o:Version>
 </o:DocumentProperties>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]-->
<link rel=themeData
href="file://localhost/Users/oliver/Library/Caches/TemporaryItems/msoclip/0clip_themedata.xml">
<!--[if gte mso 9]><xml>
 <w:WordDocument>
  <w:View>Normal</w:View>
  <w:Zoom>0</w:Zoom>
  <w:TrackMoves/>
  <w:TrackFormatting/>
  <w:PunctuationKerning/>
  <w:ValidateAgainstSchemas/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
  <w:DoNotPromoteQF/>
  <w:LidThemeOther>EN-US</w:LidThemeOther>
  <w:LidThemeAsian>JA</w:LidThemeAsian>
  <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>
  <w:Compatibility>
   <w:BreakWrappedTables/>
   <w:SnapToGridInCell/>
   <w:WrapTextWithPunct/>
   <w:UseAsianBreakRules/>
   <w:DontGrowAutofit/>
   <w:SplitPgBreakAndParaMark/>
   <w:EnableOpenTypeKerning/>
   <w:DontFlipMirrorIndents/>
   <w:OverrideTableStyleHps/>
   <w:UseFELayout/>
  </w:Compatibility>
  <m:mathPr>
   <m:mathFont m:val="Cambria Math"/>
   <m:brkBin m:val="before"/>
   <m:brkBinSub m:val="&#45;-"/>
   <m:smallFrac m:val="off"/>
   <m:dispDef/>
   <m:lMargin m:val="0"/>
   <m:rMargin m:val="0"/>
   <m:defJc m:val="centerGroup"/>
   <m:wrapIndent m:val="1440"/>
   <m:intLim m:val="subSup"/>
   <m:naryLim m:val="undOvr"/>
  </m:mathPr></w:WordDocument>
</xml><![endif]--><!--[if gte mso 9]><xml>
 <w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="true"
  DefSemiHidden="true" DefQFormat="false" DefPriority="99"
  LatentStyleCount="276">
  <w:LsdException Locked="false" Priority="0" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Normal"/>
  <w:LsdException Locked="false" Priority="9" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="heading 1"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 2"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 3"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 4"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 5"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 6"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 7"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 8"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 9"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 1"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 2"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 3"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 4"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 5"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 6"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 7"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 8"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 9"/>
  <w:LsdException Locked="false" Priority="35" QFormat="true" Name="caption"/>
  <w:LsdException Locked="false" Priority="10" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Title"/>
  <w:LsdException Locked="false" Priority="1" Name="Default Paragraph Font"/>
  <w:LsdException Locked="false" Priority="11" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtitle"/>
  <w:LsdException Locked="false" Priority="22" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Strong"/>
  <w:LsdException Locked="false" Priority="20" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Emphasis"/>
  <w:LsdException Locked="false" Priority="59" SemiHidden="false"
   UnhideWhenUsed="false" Name="Table Grid"/>
  <w:LsdException Locked="false" UnhideWhenUsed="false" Name="Placeholder Text"/>
  <w:LsdException Locked="false" Priority="1" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="No Spacing"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 1"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 1"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 1"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 1"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 1"/>
  <w:LsdException Locked="false" UnhideWhenUsed="false" Name="Revision"/>
  <w:LsdException Locked="false" Priority="34" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="List Paragraph"/>
  <w:LsdException Locked="false" Priority="29" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Quote"/>
  <w:LsdException Locked="false" Priority="30" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Quote"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 1"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 1"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 1"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 1"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 1"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 1"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 2"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 2"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 2"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 2"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 2"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 2"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 2"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 2"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 3"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 3"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 3"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 3"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 3"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 3"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 3"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 3"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 4"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 4"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 4"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 4"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 4"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 4"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 4"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 4"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 5"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 5"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 5"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 5"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 5"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 5"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 5"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 5"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 6"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 6"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 6"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 6"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 6"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 6"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 6"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 6"/>
  <w:LsdException Locked="false" Priority="19" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtle Emphasis"/>
  <w:LsdException Locked="false" Priority="21" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Emphasis"/>
  <w:LsdException Locked="false" Priority="31" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtle Reference"/>
  <w:LsdException Locked="false" Priority="32" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Reference"/>
  <w:LsdException Locked="false" Priority="33" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Book Title"/>
  <w:LsdException Locked="false" Priority="37" Name="Bibliography"/>
  <w:LsdException Locked="false" Priority="39" QFormat="true" Name="TOC Heading"/>
 </w:LatentStyles>
</xml><![endif]-->
<style>
<!--
 /* Font Definitions */
@font-face
  {font-family:"ＭＳ 明朝";
  mso-font-charset:78;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:1 134676480 16 0 131072 0;}
@font-face
  {font-family:"ＭＳ 明朝";
  mso-font-charset:78;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:1 134676480 16 0 131072 0;}
@font-face
  {font-family:Cambria;
  panose-1:2 4 5 3 5 4 6 3 2 4;
  mso-font-charset:0;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:-536870145 1073743103 0 0 415 0;}
 /* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
  {mso-style-unhide:no;
  mso-style-qformat:yes;
  mso-style-parent:"";
  margin:0cm;
  margin-bottom:.0001pt;
  mso-pagination:widow-orphan;
  font-size:12.0pt;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:"Times New Roman";
  mso-bidi-theme-font:minor-bidi;}
.MsoChpDefault
  {mso-style-type:export-only;
  mso-default-props:yes;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:"Times New Roman";
  mso-bidi-theme-font:minor-bidi;}
@page WordSection1
  {size:612.0pt 792.0pt;
  margin:72.0pt 90.0pt 72.0pt 90.0pt;
  mso-header-margin:36.0pt;
  mso-footer-margin:36.0pt;
  mso-paper-source:0;}
div.WordSection1
  {page:WordSection1;}
-->
</style>
<!--[if gte mso 10]>
<style>
 /* Style Definitions */
table.MsoNormalTable
  {mso-style-name:"Table Normal";
  mso-tstyle-rowband-size:0;
  mso-tstyle-colband-size:0;
  mso-style-noshow:yes;
  mso-style-priority:99;
  mso-style-parent:"";
  mso-padding-alt:0cm 5.4pt 0cm 5.4pt;
  mso-para-margin:0cm;
  mso-para-margin-bottom:.0001pt;
  mso-pagination:widow-orphan;
  font-size:12.0pt;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;}
</style>
<![endif]-->
</head>

<body bgcolor=white lang=EN-US style='tab-interval:36.0pt'>
<!--StartFragment--><span lang=EN style='font-size:12.0pt;font-family:Cambria;
mso-ascii-theme-font:minor-latin;mso-fareast-font-family:"ＭＳ 明朝";mso-fareast-theme-font:
minor-fareast;mso-hansi-theme-font:minor-latin;mso-bidi-font-family:"Times New Roman";
mso-bidi-theme-font:minor-bidi;mso-ansi-language:EN;mso-fareast-language:EN-US;
mso-bidi-language:AR-SA'>Obama received national </span><!--EndFragment-->
</body>

</html>
```

### Annotated Text:

```
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">

<head>
<meta name=Title content="">
<meta name=Keywords content="">
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 14">
<meta name=Originator content="Microsoft Word 14">
<link rel=File-List
href="file://localhost/Users/oliver/Library/Caches/TemporaryItems/msoclip/0/clip_filelist.xml">
<!--[if gte mso 9]><xml>
 <o:DocumentProperties>
  <o:Revision>0</o:Revision>
  <o:TotalTime>0</o:TotalTime>
  <o:Pages>1</o:Pages>
  <o:Words>20</o:Words>
  <o:Characters>120</o:Characters>
  <o:Company>Company</o:Company>
  <o:Lines>1</o:Lines>
  <o:Paragraphs>1</o:Paragraphs>
  <o:CharactersWithSpaces>139</o:CharactersWithSpaces>
  <o:Version>14.0</o:Version>
 </o:DocumentProperties>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]-->
<link rel=themeData
href="file://localhost/Users/oliver/Library/Caches/TemporaryItems/msoclip/0/clip_themedata.xml">
<!--[if gte mso 9]><xml>
 <w:WordDocument>
  <w:View>Normal</w:View>
  <w:Zoom>0</w:Zoom>
  <w:TrackMoves/>
  <w:TrackFormatting/>
  <w:PunctuationKerning/>
  <w:ValidateAgainstSchemas/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
  <w:DoNotPromoteQF/>
  <w:LidThemeOther>EN-US</w:LidThemeOther>
  <w:LidThemeAsian>JA</w:LidThemeAsian>
  <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>
  <w:Compatibility>
   <w:BreakWrappedTables/>
   <w:SnapToGridInCell/>
   <w:WrapTextWithPunct/>
   <w:UseAsianBreakRules/>
   <w:DontGrowAutofit/>
   <w:SplitPgBreakAndParaMark/>
   <w:EnableOpenTypeKerning/>
   <w:DontFlipMirrorIndents/>
   <w:OverrideTableStyleHps/>
   <w:UseFELayout/>
  </w:Compatibility>
  <m:mathPr>
   <m:mathFont m:val="Cambria Math"/>
   <m:brkBin m:val="before"/>
   <m:brkBinSub m:val="&#45;-"/>
   <m:smallFrac m:val="off"/>
   <m:dispDef/>
   <m:lMargin m:val="0"/>
   <m:rMargin m:val="0"/>
   <m:defJc m:val="centerGroup"/>
   <m:wrapIndent m:val="1440"/>
   <m:intLim m:val="subSup"/>
   <m:naryLim m:val="undOvr"/>
  </m:mathPr></w:WordDocument>
</xml><![endif]--><!--[if gte mso 9]><xml>
 <w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="true"
  DefSemiHidden="true" DefQFormat="false" DefPriority="99"
  LatentStyleCount="276">
  <w:LsdException Locked="false" Priority="0" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Normal"/>
  <w:LsdException Locked="false" Priority="9" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="heading 1"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 2"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 3"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 4"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 5"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 6"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 7"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 8"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 9"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 1"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 2"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 3"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 4"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 5"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 6"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 7"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 8"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 9"/>
  <w:LsdException Locked="false" Priority="35" QFormat="true" Name="caption"/>
  <w:LsdException Locked="false" Priority="10" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Title"/>
  <w:LsdException Locked="false" Priority="1" Name="Default Paragraph Font"/>
  <w:LsdException Locked="false" Priority="11" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtitle"/>
  <w:LsdException Locked="false" Priority="22" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Strong"/>
  <w:LsdException Locked="false" Priority="20" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Emphasis"/>
  <w:LsdException Locked="false" Priority="59" SemiHidden="false"
   UnhideWhenUsed="false" Name="Table Grid"/>
  <w:LsdException Locked="false" UnhideWhenUsed="false" Name="Placeholder Text"/>
  <w:LsdException Locked="false" Priority="1" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="No Spacing"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 1"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 1"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 1"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 1"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 1"/>
  <w:LsdException Locked="false" UnhideWhenUsed="false" Name="Revision"/>
  <w:LsdException Locked="false" Priority="34" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="List Paragraph"/>
  <w:LsdException Locked="false" Priority="29" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Quote"/>
  <w:LsdException Locked="false" Priority="30" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Quote"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 1"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 1"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 1"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 1"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 1"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 1"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 2"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 2"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 2"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 2"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 2"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 2"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 2"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 2"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 3"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 3"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 3"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 3"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 3"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 3"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 3"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 3"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 4"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 4"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 4"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 4"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 4"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 4"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 4"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 4"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 5"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 5"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 5"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 5"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 5"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 5"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 5"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 5"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 6"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 6"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 6"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 6"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 6"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 6"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 6"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 6"/>
  <w:LsdException Locked="false" Priority="19" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtle Emphasis"/>
  <w:LsdException Locked="false" Priority="21" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Emphasis"/>
  <w:LsdException Locked="false" Priority="31" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtle Reference"/>
  <w:LsdException Locked="false" Priority="32" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Reference"/>
  <w:LsdException Locked="false" Priority="33" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Book Title"/>
  <w:LsdException Locked="false" Priority="37" Name="Bibliography"/>
  <w:LsdException Locked="false" Priority="39" QFormat="true" Name="TOC Heading"/>
 </w:LatentStyles>
</xml><![endif]-->
<style>
<!--
 /* Font Definitions */
@font-face
  {font-family:"ＭＳ 明朝";
  mso-font-charset:78;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:1 134676480 16 0 131072 0;}
@font-face
  {font-family:"Cambria Math";
  panose-1:2 4 5 3 5 4 6 3 2 4;
  mso-font-charset:0;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:3 0 0 0 1 0;}
@font-face
  {font-family:Cambria;
  panose-1:2 4 5 3 5 4 6 3 2 4;
  mso-font-charset:0;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:-536870145 1073743103 0 0 415 0;}
 /* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
  {mso-style-unhide:no;
  mso-style-qformat:yes;
  mso-style-parent:"";
  margin:0cm;
  margin-bottom:.0001pt;
  mso-pagination:widow-orphan;
  font-size:12.0pt;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:"Times New Roman";
  mso-bidi-theme-font:minor-bidi;}
a:link, span.MsoHyperlink
  {mso-style-noshow:yes;
  mso-style-priority:99;
  color:blue;
  text-decoration:underline;
  text-underline:single;}
a:visited, span.MsoHyperlinkFollowed
  {mso-style-noshow:yes;
  mso-style-priority:99;
  color:purple;
  mso-themecolor:followedhyperlink;
  text-decoration:underline;
  text-underline:single;}
.MsoChpDefault
  {mso-style-type:export-only;
  mso-default-props:yes;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:"Times New Roman";
  mso-bidi-theme-font:minor-bidi;}
@page WordSection1
  {size:612.0pt 792.0pt;
  margin:72.0pt 90.0pt 72.0pt 90.0pt;
  mso-header-margin:36.0pt;
  mso-footer-margin:36.0pt;
  mso-paper-source:0;}
div.WordSection1
  {page:WordSection1;}
-->
</style>
<!--[if gte mso 10]>
<style>
 /* Style Definitions */
table.MsoNormalTable
  {mso-style-name:"Table Normal";
  mso-tstyle-rowband-size:0;
  mso-tstyle-colband-size:0;
  mso-style-noshow:yes;
  mso-style-priority:99;
  mso-style-parent:"";
  mso-padding-alt:0cm 5.4pt 0cm 5.4pt;
  mso-para-margin:0cm;
  mso-para-margin-bottom:.0001pt;
  mso-pagination:widow-orphan;
  font-size:12.0pt;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;}
</style>
<![endif]-->
</head>

<body bgcolor=white lang=EN-US link=blue vlink=purple style='tab-interval:36.0pt'>
<!--StartFragment--><span lang=EN style='font-size:12.0pt;font-family:Cambria;
mso-ascii-theme-font:minor-latin;mso-fareast-font-family:"ＭＳ 明朝";mso-fareast-theme-font:
minor-fareast;mso-hansi-theme-font:minor-latin;mso-bidi-font-family:"Times New Roman";
mso-bidi-theme-font:minor-bidi;mso-ansi-language:EN;mso-fareast-language:EN-US;
mso-bidi-language:AR-SA'>during his <a
href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004">campaign
to represent Illinois</a> in</span><!--EndFragment-->
</body>

</html>
```

### Two Paragraphs:

```
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">

<head>
<meta name=Title content="">
<meta name=Keywords content="">
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 14">
<meta name=Originator content="Microsoft Word 14">
<link rel=File-List
href="file://localhost/Users/oliver/Library/Caches/TemporaryItems/msoclip/0/clip_filelist.xml">
<!--[if gte mso 9]><xml>
 <o:DocumentProperties>
  <o:Revision>0</o:Revision>
  <o:TotalTime>0</o:TotalTime>
  <o:Pages>1</o:Pages>
  <o:Words>299</o:Words>
  <o:Characters>1706</o:Characters>
  <o:Company>Company</o:Company>
  <o:Lines>14</o:Lines>
  <o:Paragraphs>4</o:Paragraphs>
  <o:CharactersWithSpaces>2001</o:CharactersWithSpaces>
  <o:Version>14.0</o:Version>
 </o:DocumentProperties>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]-->
<link rel=themeData
href="file://localhost/Users/oliver/Library/Caches/TemporaryItems/msoclip/0/clip_themedata.xml">
<!--[if gte mso 9]><xml>
 <w:WordDocument>
  <w:View>Normal</w:View>
  <w:Zoom>0</w:Zoom>
  <w:TrackMoves/>
  <w:TrackFormatting/>
  <w:PunctuationKerning/>
  <w:ValidateAgainstSchemas/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
  <w:DoNotPromoteQF/>
  <w:LidThemeOther>EN-US</w:LidThemeOther>
  <w:LidThemeAsian>JA</w:LidThemeAsian>
  <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>
  <w:Compatibility>
   <w:BreakWrappedTables/>
   <w:SnapToGridInCell/>
   <w:WrapTextWithPunct/>
   <w:UseAsianBreakRules/>
   <w:DontGrowAutofit/>
   <w:SplitPgBreakAndParaMark/>
   <w:EnableOpenTypeKerning/>
   <w:DontFlipMirrorIndents/>
   <w:OverrideTableStyleHps/>
   <w:UseFELayout/>
  </w:Compatibility>
  <m:mathPr>
   <m:mathFont m:val="Cambria Math"/>
   <m:brkBin m:val="before"/>
   <m:brkBinSub m:val="&#45;-"/>
   <m:smallFrac m:val="off"/>
   <m:dispDef/>
   <m:lMargin m:val="0"/>
   <m:rMargin m:val="0"/>
   <m:defJc m:val="centerGroup"/>
   <m:wrapIndent m:val="1440"/>
   <m:intLim m:val="subSup"/>
   <m:naryLim m:val="undOvr"/>
  </m:mathPr></w:WordDocument>
</xml><![endif]--><!--[if gte mso 9]><xml>
 <w:LatentStyles DefLockedState="false" DefUnhideWhenUsed="true"
  DefSemiHidden="true" DefQFormat="false" DefPriority="99"
  LatentStyleCount="276">
  <w:LsdException Locked="false" Priority="0" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Normal"/>
  <w:LsdException Locked="false" Priority="9" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="heading 1"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 2"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 3"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 4"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 5"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 6"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 7"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 8"/>
  <w:LsdException Locked="false" Priority="9" QFormat="true" Name="heading 9"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 1"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 2"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 3"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 4"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 5"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 6"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 7"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 8"/>
  <w:LsdException Locked="false" Priority="39" Name="toc 9"/>
  <w:LsdException Locked="false" Priority="35" QFormat="true" Name="caption"/>
  <w:LsdException Locked="false" Priority="10" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Title"/>
  <w:LsdException Locked="false" Priority="1" Name="Default Paragraph Font"/>
  <w:LsdException Locked="false" Priority="11" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtitle"/>
  <w:LsdException Locked="false" Priority="22" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Strong"/>
  <w:LsdException Locked="false" Priority="20" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Emphasis"/>
  <w:LsdException Locked="false" Priority="59" SemiHidden="false"
   UnhideWhenUsed="false" Name="Table Grid"/>
  <w:LsdException Locked="false" UnhideWhenUsed="false" Name="Placeholder Text"/>
  <w:LsdException Locked="false" Priority="1" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="No Spacing"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 1"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 1"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 1"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 1"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 1"/>
  <w:LsdException Locked="false" UnhideWhenUsed="false" Name="Revision"/>
  <w:LsdException Locked="false" Priority="34" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="List Paragraph"/>
  <w:LsdException Locked="false" Priority="29" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Quote"/>
  <w:LsdException Locked="false" Priority="30" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Quote"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 1"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 1"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 1"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 1"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 1"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 1"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 1"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 2"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 2"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 2"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 2"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 2"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 2"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 2"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 2"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 2"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 2"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 3"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 3"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 3"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 3"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 3"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 3"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 3"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 3"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 3"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 3"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 4"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 4"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 4"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 4"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 4"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 4"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 4"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 4"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 4"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 4"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 5"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 5"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 5"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 5"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 5"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 5"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 5"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 5"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 5"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 5"/>
  <w:LsdException Locked="false" Priority="60" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Shading Accent 6"/>
  <w:LsdException Locked="false" Priority="61" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light List Accent 6"/>
  <w:LsdException Locked="false" Priority="62" SemiHidden="false"
   UnhideWhenUsed="false" Name="Light Grid Accent 6"/>
  <w:LsdException Locked="false" Priority="63" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="64" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Shading 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="65" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="66" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium List 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="67" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 1 Accent 6"/>
  <w:LsdException Locked="false" Priority="68" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 2 Accent 6"/>
  <w:LsdException Locked="false" Priority="69" SemiHidden="false"
   UnhideWhenUsed="false" Name="Medium Grid 3 Accent 6"/>
  <w:LsdException Locked="false" Priority="70" SemiHidden="false"
   UnhideWhenUsed="false" Name="Dark List Accent 6"/>
  <w:LsdException Locked="false" Priority="71" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Shading Accent 6"/>
  <w:LsdException Locked="false" Priority="72" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful List Accent 6"/>
  <w:LsdException Locked="false" Priority="73" SemiHidden="false"
   UnhideWhenUsed="false" Name="Colorful Grid Accent 6"/>
  <w:LsdException Locked="false" Priority="19" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtle Emphasis"/>
  <w:LsdException Locked="false" Priority="21" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Emphasis"/>
  <w:LsdException Locked="false" Priority="31" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Subtle Reference"/>
  <w:LsdException Locked="false" Priority="32" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Intense Reference"/>
  <w:LsdException Locked="false" Priority="33" SemiHidden="false"
   UnhideWhenUsed="false" QFormat="true" Name="Book Title"/>
  <w:LsdException Locked="false" Priority="37" Name="Bibliography"/>
  <w:LsdException Locked="false" Priority="39" QFormat="true" Name="TOC Heading"/>
 </w:LatentStyles>
</xml><![endif]-->
<style>
<!--
 /* Font Definitions */
@font-face
  {font-family:Times;
  panose-1:2 0 5 0 0 0 0 0 0 0;
  mso-font-charset:0;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:3 0 0 0 1 0;}
@font-face
  {font-family:"ＭＳ 明朝";
  mso-font-charset:78;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:1 134676480 16 0 131072 0;}
@font-face
  {font-family:"Cambria Math";
  panose-1:2 4 5 3 5 4 6 3 2 4;
  mso-font-charset:0;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:3 0 0 0 1 0;}
@font-face
  {font-family:Cambria;
  panose-1:2 4 5 3 5 4 6 3 2 4;
  mso-font-charset:0;
  mso-generic-font-family:auto;
  mso-font-pitch:variable;
  mso-font-signature:-536870145 1073743103 0 0 415 0;}
 /* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
  {mso-style-unhide:no;
  mso-style-qformat:yes;
  mso-style-parent:"";
  margin:0cm;
  margin-bottom:.0001pt;
  mso-pagination:widow-orphan;
  font-size:12.0pt;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:"Times New Roman";
  mso-bidi-theme-font:minor-bidi;}
a:link, span.MsoHyperlink
  {mso-style-noshow:yes;
  mso-style-priority:99;
  color:blue;
  text-decoration:underline;
  text-underline:single;}
a:visited, span.MsoHyperlinkFollowed
  {mso-style-noshow:yes;
  mso-style-priority:99;
  color:purple;
  mso-themecolor:followedhyperlink;
  text-decoration:underline;
  text-underline:single;}
p
  {mso-style-noshow:yes;
  mso-style-priority:99;
  mso-margin-top-alt:auto;
  margin-right:0cm;
  margin-bottom:5.75pt;
  margin-left:0cm;
  mso-pagination:widow-orphan;
  font-size:10.0pt;
  font-family:Times;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-bidi-font-family:"Times New Roman";}
.MsoChpDefault
  {mso-style-type:export-only;
  mso-default-props:yes;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:"ＭＳ 明朝";
  mso-fareast-theme-font:minor-fareast;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:"Times New Roman";
  mso-bidi-theme-font:minor-bidi;}
@page WordSection1
  {size:612.0pt 792.0pt;
  margin:72.0pt 90.0pt 72.0pt 90.0pt;
  mso-header-margin:36.0pt;
  mso-footer-margin:36.0pt;
  mso-paper-source:0;}
div.WordSection1
  {page:WordSection1;}
-->
</style>
<!--[if gte mso 10]>
<style>
 /* Style Definitions */
table.MsoNormalTable
  {mso-style-name:"Table Normal";
  mso-tstyle-rowband-size:0;
  mso-tstyle-colband-size:0;
  mso-style-noshow:yes;
  mso-style-priority:99;
  mso-style-parent:"";
  mso-padding-alt:0cm 5.4pt 0cm 5.4pt;
  mso-para-margin:0cm;
  mso-para-margin-bottom:.0001pt;
  mso-pagination:widow-orphan;
  font-size:12.0pt;
  font-family:Cambria;
  mso-ascii-font-family:Cambria;
  mso-ascii-theme-font:minor-latin;
  mso-hansi-font-family:Cambria;
  mso-hansi-theme-font:minor-latin;}
</style>
<![endif]-->
</head>

<body bgcolor=white lang=EN-US link=blue vlink=purple style='tab-interval:36.0pt'>
<!--StartFragment-->

<p style='margin-bottom:0cm;margin-bottom:.0001pt'><span lang=EN
style='mso-ansi-language:EN'>In 2004, Obama received national attention during
his <a
href="https://en.wikipedia.org/wiki/United_States_Senate_election_in_Illinois,_2004">campaign
to represent Illinois</a> in the United States Senate with his victory in the
March Democratic Party primary, his keynote address at the Democratic National Convention
in July, and his election to the Senate in November. He began his presidential
campaign in 2007 and, after a close primary campaign against Hillary Rodham
Clinton in 2008, he won sufficient delegates in the Democratic Party primaries
to receive the presidential nomination. He then defeated Republican nominee
John McCain in the general election, and was inaugurated as president on
January 20, 2009. Nine months after his inauguration, Obama was named the 2009
Nobel Peace Prize laureate.<o:p></o:p></span></p>

<p style='margin-bottom:0cm;margin-bottom:.0001pt'><span lang=EN
style='mso-ansi-language:EN'>During his first two years in office, Obama signed
into law economic stimulus legislation in response to the Great Recession in
the form of the American Recovery and Reinvestment Act of 2009 and the Tax
Relief, Unemployment Insurance Reauthorization, and Job Creation Act of 2010.
Other major domestic initiatives in his first term included the Patient
Protection and Affordable Care Act, often referred to as &quot;Obamacare&quot;;
the Dodd–Frank Wall Street Reform and Consumer Protection Act; and the Don't Ask,
Don't Tell Repeal Act of 2010. In foreign policy, Obama ended U.S. military
involvement in the Iraq War, increased U.S. troop levels in Afghanistan, signed
the New START arms control treaty with Russia, ordered U.S. military
involvement in Libya in opposition to Muammar Gaddafi, and ordered the military
operation that resulted in the death of Osama bin Laden. In January 2011, the
Republicans regained control of the House of Representatives as the Democratic
Party lost a total of 63 seats; and, after a lengthy debate over federal
spending and whether or not to raise the nation's debt limit, Obama signed the
Budget Control Act of 2011 and the American Taxpayer Relief Act of 2012.<o:p></o:p></span></p>

<!--EndFragment-->
</body>

</html>
```
