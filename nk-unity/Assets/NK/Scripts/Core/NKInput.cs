using UnityEngine;

namespace NK
{
    /// <summary>
    /// Estado de entrada do quadro atual (preenchido pelos controles de toque/teclado ou pelo autoteste).
    /// Botões "Pressed" valem só por um quadro.
    /// </summary>
    public static class NKInput
    {
        public static Vector2 Move;        // joystick (-1..1)
        public static bool Sprint;         // joystick empurrado além do círculo
        public static bool SprintLock;     // trava de corrida (arrastar bem para cima)
        public static Vector2 Look;        // graus neste quadro (x = guinada, y = arfagem, positivo = para cima)
        public static bool Fire;           // segurando qualquer botão de tiro
        public static bool JumpPressed, CrouchPressed, PronePressed, ReloadPressed, ViewPressed, AdsPressed;

        /// <summary>Quando true, os controles não escrevem Move/Look/Fire (o autoteste controla).</summary>
        public static bool Scripted;

        public static void ClearFrame()
        {
            JumpPressed = CrouchPressed = PronePressed = ReloadPressed = ViewPressed = AdsPressed = false;
            Look = Vector2.zero;
        }
    }
}
