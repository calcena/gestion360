<?php
require_once __DIR__ .'/../../helpers/helper.php';
get_session_status();
if ($source == 'main') {
    $level = '../';
} else if ($source == 'animals') {
    $level = '../../';
} else {
    $level = './';
}
?>
<span>© Gestión de tareas C. Ponç</span>
<p class="mt-4"></p>
<?php
show_envoironment_message()
    ?>