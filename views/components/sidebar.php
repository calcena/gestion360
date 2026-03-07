<div id="lateral-menu" class="lateral-menu">
    <div class="menu-items">
        <div class="w-75 mt-1 ms-3 d-flex align-items-center justify-content-center">
            <input class="form-control" id="buscador" type="text" placeholder="Buscador..."
                onkeyup="searchParam(this.value)">
            <img src="<?php echo $GLOBALS['pathUrl'] ?>assets/images/icons/search.png" alt="Buscador"
                class="menu-icon-right-mini ms-2">
        </div>
        <hr class="border border-1 border-secondary w-100" />
        <?php if ($_SESSION['user']['role_id'] == 1 ||$_SESSION['user']['role_id'] == 2 ): ?>
            <div class="menu-item text-center mt-3"
                onclick="menuAction('crear_tarea', <?php echo $GLOBALS['navigation_deep']; ?>)">
                <img src="<?php echo $GLOBALS['pathUrl']; ?>assets/images/icons/add.png" alt="Crear Envio"
                    class="menu-icon-right">
                <div class="menu-text-option">Crear Tarea</div>
            </div>
            <hr class="border border-1 border-secondary w-100" />
        <?php endif; ?>
        <div class="menu-item text-center" onclick="menuAction('salir',<?php echo $GLOBALS['navigation_deep'] ?>)">
            <img src="<?php echo $GLOBALS['pathUrl'] ?>assets/images/icons/exit.png" alt="Salir"
                class="menu-icon-right">
            <div class="menu-text-option">Salir</div>
        </div>
    </div>
</div>
<!-- Overlay oscuro (opcional, mejora UX) -->
<div id="menu-overlay" class="menu-overlay" onclick="hideLateralMenu()"></div>