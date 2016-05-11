# Canny

## Usage

Include the jQuery and Canny  
```html
<script src="jquery.js"></script>  
<script src="jquery-canny.x.x.x.js"></script>
```
Include CSS  
```html
<link href="canny.css" rel="stylesheet" />
```

Markup
```html
<html>
  <head>
    <title>Canny Demo</title>
    <script src="jquery-1.11.1.min.js"></script>  
    <script src="jquery-canny.x.x.x.js"></script>
    <link href="canny.css" rel="stylesheet" />
  </head>
  
  <body>
    <!-- Default page content -->
    <div id="container">
      <button id="canny-toggle">Menu</button
      <!-- Content -->
    </div>
    
    <!-- Canny -->
    <ul id="canny">
      <li><a href="">Link 1</a></li>
      <li>
        <a href="">Link 2</a>
        <ul>
          <li><a href="">Link 2 1</a></li>
          <li><a href="">Link 2 2</a></li>
          <li><a href="">Link 2 3</a></li>
        </ul>
      </li>
      <li><a href="">Link 3</a></li>
      <li><a href="">Link 4</a></li>
    </ul>
  </body>
</html>
```

jQuery

```js
$(function() {
  var myCanny = $('#canny').canny({
    contentWrap: '#container',
    navToggle: '#canny-toggle'
  });
});
```

## Options

**cannyParent**

**Value:** ID or Class (e.g.: ``'#container'`` or ``'.container'``)  
**Default:** ``null``

The element that contains Canny and ``contentWrap``, if empty Canny searches for nearest parent. Set if Canny is wrapped by a ``<nav>`` - element or something else.

- - - -

**contentWrap**

**Value:** ID or Class (e.g.: ``'#container'`` or ``'.container'``)  
**Default:** ``''``

This is the element that contains the content. It should be the outermost element in your markup and it **must not contain** Canny. It needs to be set if you want to use ``pushContent``.

- - - -

**openClass**

**Value:** Class name  
**Default:** ``'canny-open'``

The class that ``cannyParent`` gets when Canny is open.

- - - -

**openingClass**

**Value:** Class name  
**Default:** ``'canny-opening'``

The class that ``cannyParent`` and ``overlay`` are getting when Canny is opening.

- - - -

**closingClass**

**Value:** Class name  
**Default:** ``'canny-closing'``

The class that ``cannyParent`` and ``overlay`` are getting when Canny is closing.

- - - -

**pushContent**

**Value:** ``true`` or ``false``  
**Default:** ``false``

If ``pushContent`` is ``true`` then the ``contentWrap`` is pushed sideways with Canny.

- - - -

**fixedView**

**Value:** ``true`` or ``false``  
**Default:** ``true``

If ``true`` the page can not be scrolled when Canny is open.

- - - -

**layers**

**Value:** ``true`` or ``false``
**Default:** ``false``

Submenus are opend as layers on top of each other.

- - - -

**navOffset**

**Value:** Number
**Default:** ``0``

If the value is greater then 0, Canny is visible by the amount of the value in pixels. Useful if you want to add a toggle within Canny.

- - - -

**navToggle**

**Value:** ID or Class (e.g.: ``'#container'`` or ``'.container'``)  
**Default:** ``''``

The element that opens and closes Canny.

- - - -

**navPosition**

**Value:** ``'left'`` or ``'right'``  
**Default:** ``'left'``

Position of the menu. Currently you can place Canny either on the left or right side.

- - - -

**transitionSpeed**

**Value:** Number (in miliseconds)
**Default:** ``300``

How fast Canny slides in and out.

- - - -

**dragToClose**

**Value:** ``true`` or ``false``
**Default:** ``false``

Close Canny by dragging it.

- - - -

**threshold**

**Value:** ``'default'`` or Number
**Default:** ``300``

How far Canny needs to get dragged until it closes.

- - - -

**overlay**

**Value:** ``true`` or ``false``
**Default:** ``false``

Toggles the overlay.

- - - -

**closeButton**

**Value:** ``true`` or ``false``
**Default:** ``false``

Enables close-button in Canny.

- - - -

**closeButtonLabel**

**Value:** String
**Default:** ``'<span>Close</span>'``

Sets the label of close-button.

- - - -

**backButtonLabel**

**Value:** String
**Default:** ``'&laquo; Back'``

Changes label of back-button.

- - - -

**copyParentLink**

**Value:** ``true`` or ``false``
**Default:** ``false``

Copies parent-link to sub-menu.
