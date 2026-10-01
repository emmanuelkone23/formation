SITE PROGRAMMEUR FOU — Dev Full Stack
=====================================

Structure
---------
index.html                  Page principale (textes et sections)
css/style.css               Design : couleurs, polices, mise en page
js/main.js                  Univers 3D (Three.js) et animations au défilement
assets/couverture-ebook.jpg Couverture de l'ebook affichée sur le livre 3D
vendor/three.min.js         Bibliothèque 3D Three.js (r128), incluse en local

Ouvrir le site
--------------
Le livre 3D charge une image : certains navigateurs la bloquent si on ouvre
index.html par double-clic. Pour tester en local, lance un petit serveur :
  python -m http.server 8000      puis ouvre http://localhost:8000
Une fois en ligne (Netlify, Vercel, GitHub Pages...), tout fonctionne directement.

Modifier
--------
- Lien de la boutique : cherche "udtzidvu.mychariow.com" dans index.html
- Couleurs : bloc :root en haut de css/style.css
- Textes : directement dans index.html
- Objets 3D : sections "Station 0" à "Station 6" dans js/main.js

Les polices (Syne, Manrope, JetBrains Mono) viennent de Google Fonts
(connexion internet nécessaire, sinon polices de secours).
