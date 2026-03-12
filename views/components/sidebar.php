<?php
$navDeep = isset($navigation_deep) ? $navigation_deep : 0;
$basePath = str_repeat('../', $navDeep);
$iconPath = $basePath . 'assets/images/icons/';
?>
<div id="lateral-menu" class="lateral-menu">
    <div class="menu-items">
        <div class="w-75 mt-1 ms-3 d-flex align-items-center justify-content-center">
            <input class="form-control" id="buscador" type="text" placeholder="Buscador...">
            <img src="<?php echo $basePath ?>assets/images/icons/search.png" alt="Buscador"
                class="menu-icon-right-mini ms-2">
        </div>
        <hr class="border border-1 border-secondary w-100" />
         <?php if ($_SESSION['user']['role_id'] == 1 ||$_SESSION['user']['role_id'] == 2 ): ?>
             <div class="menu-item text-center mt-3"
                 data-action="crear_tarea" data-nav-deep="<?php echo $navDeep; ?>">
                 <img src="<?php echo $basePath; ?>assets/images/icons/add.png" alt="Crear Envio"
                     class="menu-icon-right">
                 <div class="menu-text-option">Crear Tarea</div>
             </div>
             <hr class="border border-1 border-secondary w-100" />
         <?php endif; ?>
         <div class="menu-item text-center" data-action="salir" data-nav-deep="<?php echo $navDeep ?>">
             <img src="<?php echo $basePath ?>assets/images/icons/exit.png" alt="Salir"
                 class="menu-icon-right">
             <div class="menu-text-option">Salir</div>
         </div>
          <div id="user-name-display" class="mt-auto pt-4 text-center" style="color: #228B22; font-weight: bold; font-size: 16px; border-top: 1px solid #ccc; margin-top: 20px;">
              <?php echo htmlspecialchars($_SESSION['user']['nombre'] ?? $_SESSION['user']['usuario'] ?? ''); ?>
          </div>
    </div>
</div>
 <!-- Overlay oscuro (opcional, mejora UX) -->
 <div id="menu-overlay" class="menu-overlay"></div>