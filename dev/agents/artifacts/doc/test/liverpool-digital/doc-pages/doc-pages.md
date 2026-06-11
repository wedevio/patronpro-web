# PatronPro Panel Doc Pages Export

Generated: 2026-06-11T23:33:12.136Z
Pages: 2

## Manual de Onboarding de Clientes

Slug: onboarding
Published: true
Updated: 2026-06-04T14:19:36.830453+00:00

## 1. Propósito y alcance
Este manual cubre el proceso de onboarding de un nuevo cliente de PatronPro de principio a fin: desde que se registra y paga en la web hasta que su subcuenta de PatronPro queda activa y lista para usar.
El onboarding está completo cuando el cliente puede acceder a su cuenta, tiene el número de teléfono activo, puede cobrar a sus clientes con Stripe y sabe ejecutar las tres tareas básicas de la plataforma.
### 1.1 Objetivos del onboarding
• Cuenta operativa desde el primer día. El cliente recibe su subcuenta de GHL configurada, verificada y lista para usar.
• Información capturada antes de la cita. Todo lo que no requiere al cliente en directo se resuelve antes: la cita es eficiente y enfocada.
• Mínima fricción. Sin ida y vuelta de correos innecesarios ni tareas que el cliente deba resolver por su cuenta.
• Cumplimiento legal y financiero. El registro A2P de Twilio y la configuración de Stripe se completan correctamente en la cita.
### 1.2 Alcance
Dentro del alcance:
• El proceso operativo de onboarding, de principio a fin.
• La configuración de la subcuenta en PatronPro.

Fuera del alcance:
• El proceso comercial y de venta previo al alta.
• El soporte continuado una vez la cuenta está activa.
### 1.3 Principios de operación
Tres principios rigen este proceso:
1. Minimizar el esfuerzo del cliente en la configuración. La cita es para lo que solo el cliente puede resolver en directo. Todo lo demás se prepara antes o después.
2. La cuenta permanece en pausa. El cliente no accede a su subcuenta hasta que el onboarding está completo por nuestra parte.
3. Mejora continua del proceso. Identificar oportunidades en el onboarding con el fin de optimizar tiempos, reducir fricción del cliente y dar mejor servicio.
## 3. Glosario
• Go High Level (GHL): Plataforma CRM/ERP sobre la que opera PatronPro.
• Subcuenta: Instancia individual de GHL que se crea para cada cliente.
• Snapshot: Plantilla preconfigurada (pipelines, automatizaciones, calendarios) que se aplica a la subcuenta al crearla.
• Custom values: Variables reutilizables de GHL para webs, emails y automatizaciones.
• Custom fields: Campos personalizados por contacto (p. ej. el idioma).
• Pipeline: Embudo de oportunidades dentro de GHL.
• Workflow / Automatización: Secuencia automática de acciones en GHL.
• A2P 10DLC: Registro obligatorio para enviar SMS desde números locales en EE. UU.
• EIN: Employer Identification Number — identificador fiscal del negocio en EE. UU.
• SSN: Social Security Number — número de seguridad social del titular.
• Stripe: Pasarela de pagos que el cliente configura para cobrar a sus propios clientes.
• DKIM / SPF / DMARC: Registros DNS de autenticación de correo electrónico.
## 4. Visión general del flujo
El onboarding se estructura en tres fases secuenciales. Cada una tiene un responsable claro y termina con un resultado concreto:

• Fase 1 — Alta y captura (cliente + automatizaciones)
  Qué ocurre: el cliente paga, agenda la cita y rellena el formulario de onboarding.
  Resultado: cuenta pagada y en pausa, cita agendada, información del cliente capturada.

• Fase 2 — Configuración previa (Onboarding Manager)
  Qué ocurre: el Onboarding Manager configura la subcuenta con los datos recibidos, antes de que llegue la cita.
  Resultado: subcuenta preconfigurada al ~80%; nada que pueda hacerse sin el cliente queda pendiente.

• Fase 3 — Cita de onboarding (Onboarding Manager + cliente)
  Qué ocurre: se completan los trámites que requieren la presencia del cliente — A2P, Stripe, idioma, horarios y formación básica.
  Resultado: número de teléfono activo y solicitud de aprobación solicitada, Stripe operativo, cliente formado.

• Fase 4 - Verificación y acceso.
  Qué ocurre: Se confirma la aprobación por parte de Twillio, Stripe. Se revisa que todo esta funcionando como debería y todo el checklist de Onboarding esta listo.
  Resultado: El cliente tiene sus accesos para empezar a trabajar y el sistema está totalmente funcional.
> Vídeo — Recorrido general del flujo: VÍDEO — POR INCORPORAR
Recorrido general del flujo de onboarding (visión global, aprox. 3 minutos).
## 5. Fase 1 — Alta, pago, cita de onboarding y formulario
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779884770147-n56anqrm48.mp4)

_Fase 1. Completa_
### 5.1 Pre-registro en la web
El cliente crea su cuenta antes de pagar, a través de un pop-up en la web de PatrnPoro.
Esto cumple dos funciones: iniciar el tracking de quién intenta registrarse y poder recuperar a quienes abandonen antes de completar el pago.
El cliente se registra en la cuenta agencia de PatronPro como `lead` para activar un flujo de recuperación si no llega a pagar.
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779880518233-6nzkbw2mtkv.png)
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779880544788-urdslybp86.png)
### 5.2 Pasarela de pago y creación de la subcuenta
Tras el pre-registro, el cliente es redirigido a la pasarela de pago nativa de GHL.

Al completar el pago:
• GHL vincula la transacción al contacto y crea la subcuenta del cliente.
• Se aplica automáticamente el snapshot correspondiente (pipelines, automatizaciones y calendarios base).
• El cliente es redirigido a la página de agendamiento.

Sugerido verificar: plan/producto correcto, importe, moneda, impuestos y envío automático del recibo de pago.
> Vídeo — Pasarela de pago: VÍDEO — POR INCORPORAR
Proceso de pago y creación automática de la subcuenta con el snapshot.
### 5.3 Agendamiento de la cita de onboarding
Inmediatamente después del pago, el cliente elige su franja horaria con el Onboarding Manager.
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779883694068-gsripbn9rom.png)
Si no agenda de inmediato, se activan dos flujos de recuperación automáticos en GHL. A los 30 minutos sin reserva, recibe un email de seguimiento.

Una vez agendada la cita, la Fase 1 está completa: cuenta pagada, cita reservada, cliente en espera.
> Pendiente de definir — 5.3: Acción requerida: documentar los dos flujos de recuperación de agendamiento — disparador exacto, número de pasos, cadencia de emails/SMS y condición de salida del flujo.
### 5.4 Estado de la cuenta: en pausa
Con el pago completado y la cita agendada, la cuenta entra en estado «en pausa»: el cliente no tiene acceso a su subcuenta.

Esto es deliberado. Evita que el cliente entre a una cuenta sin configurar y garantiza que la entrega sea de una subcuenta completa y operativa.
> Pendiente de definir — 5.4: Acción requerida: documentar el mecanismo técnico exacto de «pausa» en GHL (p. ej. no enviar credenciales, usuario inactivo, plan en estado pendiente) para que cualquier miembro del equipo pueda ejecutarlo de forma consistente.
### 5.5 Formulario de onboarding
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779884348621-srusa0thmnm.png)

_Primer Step del Formulario de Onboarding del Cliente_
A los 2 minutos de agendar la cita, el cliente recibe el formulario de onboarding por email. Es el instrumento central de la Fase 1: cuanta más información capturemos aquí, menos tiempo ocupa la cita.
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779884396956-1etz6xx38cp.png)

_Email con el link al formulario_
Estructura del formulario:
• Step 1 — Negocio: nombre comercial, nombre legal, EIN (opcional) y datos legales.
• Step 2 — Branding: Sector, Información descriptiva del negocio, logo (propio o generado con IA) y selección de colores.
• Step 3 — Horario: horario de atención del negocio para la web.
• Step 4 — Dominio: si dispone de dominio o desea comprar uno, más autorización de compra.
• Step 5 — Revisión de la información dada.
Las respuestas se mapean automáticamente a custom values de la subcuenta en GHL.

### 5.6 Email de preparación de la cita
Una vez enviado el formulario, el cliente no tiene que hacer nada más hasta la cita, salvo reunir lo que se le indica en este email.

El email lista exactamente qué debe traer: los documentos para el registro A2P de Twilio y los datos financieros para la configuración de Stripe. Ver el detalle completo en el Anexo B.
> Pendiente de Crear: Falta crear el email, la lista y publicarlo.
### 5.7 Portal interno de gestión
Todo lo que el cliente envía — formulario, logo, preferencias visuales — queda centralizado en el portal interno de gestión. El Onboarding Manager trabaja desde este portal para trasladar la información a PatronPro y hacer seguimiento del status de cada cuenta.
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779884886389-u6wgut3lqz.png)
> Pendiente de definir — 5.7: Acción requerida: documentar el portal interno — cómo se accede, cómo está organizado por cliente y cómo se registra el progreso de cada paso del onboarding.
## 6. Fase 2 — Configuración previa por el Onboarding Manager
Objetivo de la fase: llegar a la cita con todo lo que no requiere la presencia del cliente ya resuelto. Al terminar la Fase 2, la subcuenta debe estar configurada al ~80%: snapshot verificado, branding aplicado, web y dominio listos, calendarios activos.

El Onboarding Manager ejecuta esta fase entre la recepción del formulario y el inicio de la cita.
### 6.1 Verificación del snapshot
Primer paso al abrir la subcuenta: verificar que el snapshot se aplicó correctamente.

• Confirmar que los pipelines, automatizaciones y calendarios base están presentes y activos.
• No recrear nada que ya venga del snapshot; solo verificar.
- Snippets.
- Dashboard.
- Website con páginas legales.
- Formularios
- Contratos, etc.

No es necesario comprobar esto cada vez, ya que el proceso automatizado no va a cambiar, pero si después de algunos cambios o de forma esporádica para verificar que nada ha fallado.
### 6.2 Formulario de Creación de Contactos
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780566180962-cy9xz01r69k.mp4)
Personalizar la vista de alta de contactos para incluir el campo `Language`. Este campo es crítico: determina en qué idioma recibe cada contacto del cliente los mensajes automáticos.
Debemos añadir al Creation Contact View la opción de forma obligatoria seleccionar un idioma al añadir contactos. De esta forma nos aseguramos que todos los workflows funcionen correctamente.

1. Desde el Contact Tab haremos click en "Add Contact" y una vez se abre el panel lateral hay que hacer click en "Customice Form".
2. Se abre otro panel lateral con los diferentes campos que se pueden incluir en ese formulario. Buscar y hacer click en `idioma` y marcarlo como "Required"
3. Eliminaremos `DND Channels`
4. Guardar la vista
### 6.3 Calendarios
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779889869786-hu0q6s5kd0m.mp4)
El snapshot incluye dos calendarios por defecto: uno para free consultations y otro para visitas. En esta fase:

• Asignar un miembro del staff a cada uno.
• Activar los dos calendarios.

Los horarios definitivos se afinarán con el cliente en la cita (ver §7.5).

Revisar notificaciones y recordatorios automáticos, duración y buffers entre citas, formulario asociado y zona horaria.

Solo debemos confirmar que esten activos los recordatorios de 24 horas y 1 hora. El resto de automatizaciones se gestionan a través de Workflows
### 6.4 Dominio y DNS
Depende de lo indicado por el cliente en el formulario:

• Si autorizó la compra: comprar el dominio ahora y configurar los registros DNS de web y correo.
• Si ya tiene dominio y no autorizó la compra: esta parte se resuelve en la cita (ver §7.2), donde el cliente aportará las credenciales de su proveedor.
### 6.4.1 Compra de Dominio y Configuración
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780048622156-bkqba4wnyzl.mp4)

_Proceso completo de compra del dominio_
Si un cliente ha solicitado comprar el dominio, tenemos que dirigirnos al apartado en settings de Domains y adquirir el dominio solicitado.

**Step 1 — Comprar el dominio**
Dentro de la cuenta del cliente, entra en Settings → Domains y haz clic en Purchase Domain. Busca el dominio solicitado por el cliente, comprueba que esté disponible y realiza la compra. El pago se cargará directamente a la tarjeta del cliente, usando los datos autorizados durante el registro/onboarding.

**Step 2 — Esperar la activación del dominio**
Una vez comprado, la plataforma empezará a registrar y activar el dominio automáticamente. Este proceso puede tardar unos minutos. Cuando el dominio aparezca como activo, entra en Manage para continuar con la configuración.

**Step 3 — Conectar el dominio al Website/Funnel**
Desde Manage, conecta primero el producto de Website/Funnel. Selecciona el dominio principal y acepta la redirección automática de www hacia el dominio raíz. Después, conecta los records necesarios. Si aparece algún error, espera unos minutos y vuelve a verificar, ya que normalmente se debe a propagación.
**
Step 4 — Asignar la web del cliente**
Selecciona la web correspondiente del cliente y define cuál será la página principal o home. Comprueba que el dominio carga correctamente y que la redirección funciona bien.
> Añadir a Custom Values: Una vez tenemos el dominio correctamente configurado lo añadimos en Custom Values. Al campo Dominio Web
### 6.4.2 Autenticación de email en caso de compra
**Step 5 — Configurar el dominio de email**
Ve a Email Services y añade el dominio de envío usando el prefijo estándar email. delante del dominio del cliente. Por ejemplo: email.dominio.com. Luego verifica los records correspondientes.

**Step 6 — Configurar los Headers de envío**
Una vez verificado el dominio de email, completa los headers. En From Name, coloca el nombre de la empresa del cliente. En From Email, usa por defecto info@email.dominio.com, salvo que el cliente haya solicitado otra dirección específica.
> Añadir a Custom Values: Una vez tenemos el email correctamente configurado lo añadimos en Custom Values. Al campo Automation Sender Email
### 6.4.3 Verificación
**Step 7 — Verificación final**
Vuelve a Domains y comprueba que el website, la redirección y el email aparecen correctamente conectados y verificados. Si todo está activo, la configuración del dominio queda finalizada. También conviene confirmar que la auto-renovación está activa para evitar problemas futuros.Escribe aquí el contenido…
### 6.5 Website y HTML
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780054275959-4kjq8k04gmg.mp4)
Step 3 — Generar el HTML de la website
Desde el panel de Patron Pro, espera a que finalice el proceso de generación de la website. El sistema generará un HTML personalizado usando la información del cliente y sus Custom Values. Cuando el HTML esté listo, cópialo para poder insertarlo en la plantilla web correspondiente dentro de Go High Level.

Step 4 — Insertar el HTML en la Home
Entra en la subcuenta del cliente y ve a Sites → Websites. Abre la website correspondiente, por ejemplo Construction Company, y edita la página Home. Dentro del bloque HTML principal, pega el código generado desde Patron Pro. Guarda los cambios con Save.

Step 5 — Publicar la website en el dominio del cliente
Una vez guardado el HTML, publica la página. Si el dominio ya fue configurado previamente, debería aparecer directamente como opción disponible. Selecciona el dominio del cliente y haz clic en Publish. Después, abre la URL publicada para comprobar que la website carga correctamente con el logo, los colores, el contenido y los datos personalizados del cliente.

Step 6 — Revisar las imágenes generadas con IA
El sistema también genera tres imágenes adaptadas al negocio del cliente. En principio, estas imágenes deberían subirse automáticamente al Media Storage y vincularse a los Custom Values correspondientes. Si la automatización falla, descarga manualmente las imágenes generadas, súbelas en Media Storage → Upload Files y copia el enlace de cada imagen.

Step 7 — Añadir manualmente las imágenes si hiciera falta
Si alguna imagen no se ha vinculado automáticamente, ve a Settings → Custom Values y busca el valor correspondiente, por ejemplo Website Hero Image. Edita el campo, pega el enlace de la imagen subida al Media Storage y guarda los cambios. Al volver a la website, la imagen debería aplicarse automáticamente como fondo o imagen correspondiente.

Step 8 — Ajustar detalles visuales básicos
Revisa que el logo tenga un tamaño correcto, tanto en la parte superior como en el footer. Comprueba también que los colores, textos, iconos sociales, dirección y datos de contacto se visualicen correctamente. Si algo queda desajustado, corrígelo directamente en el HTML o en los Custom Values, según corresponda.

Step 9 — Comprobar los enlaces legales
Verifica que los enlaces de Privacy Policy, Terms & Conditions y demás páginas legales funcionen correctamente. Si algún enlace lleva a una página incorrecta, revisa el Custom Value del dominio y asegúrate de que esté escrito correctamente, incluyendo https:// y el dominio final del cliente. Después guarda y publica de nuevo la website.

Step 10 — No añadir formularios todavía
En esta fase no se debe añadir ningún formulario directamente en la website. Aunque algunos botones indiquen textos como “Solicite su presupuesto”, la captación inicial debe gestionarse desde el chat. Los formularios o calendarios se añadirán más adelante, después de completar la aprobación correspondiente de Twilio/Go High Level.
> Formularios: No incluir en esta fase el formulario/calendario de "On Site Call" en el lugar designado para ello.
### 6.6 Branding de la subcuenta
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780066036368-mlf96vpj0o.mp4)
Con el logo y la paleta de colores que el cliente aportó en el formulario:

Step 1 — Revisar los colores facilitados por el cliente
Antes de tocar la configuración, entra en el panel del cliente y revisa los colores que ha indicado durante el onboarding. Aunque el cliente haya dado tres colores concretos, no es obligatorio respetar exactamente el orden en el que los ha enviado. La idea es usarlos con criterio para que la marca funcione bien visualmente en la web, emails y elementos del sistema.

Step 2 — Acceder a Brand Boards
Dentro de la subcuenta del cliente, ve a Marketing → Brand Boards → Global Settings. Desde ahí se configuran los colores globales de la marca. Estos colores se aplicarán automáticamente en diferentes partes del sistema, por lo que es importante dejarlos bien definidos desde el principio.

Step 3 — Definir los colores.
El color Main debe ser el color principal de la marca, pero conviene que no sea demasiado agresivo ni excesivamente saturado. Si el cliente ha enviado colores muy vivos, es mejor no poner el más intenso como Main, porque puede cargar demasiado la web o dificultar la lectura.

El color Accent debe utilizarse para destacar elementos concretos: botones, detalles visuales, llamadas a la acción o puntos de atención. Si uno de los colores del cliente es más vivo o llamativo, normalmente encaja mejor aquí. Es el color “mira aquí”, no el color “te grito en toda la cara”.

El color Complementary debería ser un tono más oscuro o neutro que ayude a crear contraste y mejorar la legibilidad. Este color suele funcionar bien en zonas como footer, headers, fondos secundarios o elementos donde necesitamos más profundidad visual.
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780066205966-sj9jt2fgrko.png)
Step 4 — Guardar los cambios
Una vez asignados los colores en Global Settings, guarda los cambios. En principio, no hace falta configurar mucho más, porque el sistema aplica estos colores automáticamente en las áreas conectadas a los Brand Boards.

Step 5 — Revisar la website
Después de guardar, revisa la website del cliente para comprobar que los colores se han aplicado correctamente. Fíjate especialmente en el hero, botones, footer y secciones principales. Si el resultado visual no funciona bien, vuelve a Brand Boards y reajusta el orden de los colores.

Step 6 — Revisar los emails
Ve a Marketing → Emails → Templates y abre una plantilla de email para comprobar que los colores también se están aplicando correctamente. Revisa botones, links, cabeceras y elementos destacados. Si todo aparece bien, puedes dar esta parte por validada.
![]()
### 6.7 Idioma de la plataforma
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780494678449-u7by349upw.mp4)
**Step 1 — Revisar el idioma solicitado**
En el panel, revisa qué idioma ha indicado el cliente para usar la plataforma. Normalmente será español o inglés.

**Step 2 — Entrar como el usuario del cliente**
Ve a Staff y busca cómo se registró el usuario principal del cliente. Desde ahí, usa la opción Login As para entrar como si fueras esa persona.

**Step 3 — Cambiar el idioma desde el perfil**
Dentro de la cuenta del usuario, entra en My Profile. Cambia el idioma de la plataforma al idioma solicitado por el cliente.
**
Step 4 — Guardar los cambios**
Haz clic en Update Profile para guardar. Con esto, el idioma de la plataforma del cliente queda configurado.
### 6.8 Activación de Notificaciones de Invoices, Contratos y Documentos
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780494741525-ihzitjaxx2.mp4)
**Step 1 — Revisar el idioma del cliente**
Primero revisa en el panel qué idioma ha elegido el cliente para comunicarse con sus propios clientes: español o inglés. Esto define qué templates hay que aplicar.

**Step 2 — Configurar notificaciones de Payments, Invoices y Estimates**
Ve a Payments → Invoices & Estimates → Settings → Notifications → Customer Notifications.
En cada notificación, selecciona el template correspondiente al idioma del cliente. Por ejemplo, si el cliente quiere comunicarse en español, usa el template de Invoice Received en español; si lo quiere en inglés, usa la versión en inglés.

**Step 3 — Revisar también los SMS**
Haz lo mismo con los templates de SMS. Cada notificación debe tener asignado el email y/o SMS correcto según el idioma seleccionado. Revisa especialmente notificaciones como Invoice Received, Estimate Received e Invoice Payment Successful.

**Step 4 — Guardar cambios**
Cuando todas las notificaciones de invoices y estimates tengan el template correcto, haz clic en Save.

**Step 5 — Configurar Documents & Contracts**
Ve a Documents & Contracts y revisa las notificaciones de Document Received y Document Signed. Activa SMS si corresponde y asigna los templates correctos según el idioma del cliente.

**Step 6 — Desactivar notificaciones que se gestionan por workflows**
Si hay alguna notificación que ya se está trabajando desde workflows, desactívala para evitar duplicados. En este caso el `Document Expiry Warning Email`. Después guarda los cambios.
### 6.9 Pipelines y automatizaciones
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780067132541-5y9covm4szv.mp4)
Los pipelines y la mayoría de las automatizaciones vienen ya configurados en el snapshot. La tarea aquí es verificar, no recrear:

• Revisar que los disparadores están activos y apuntan a los pasos correctos.
• Confirmar que las plantillas de email y SMS están en el idioma del cliente.
• Comprobar que los custom values del negocio (nombre, teléfono, etc.) se reflejan correctamente en los mensajes.
## 7. Fase 3 — La cita de onboarding
Objetivo de la fase: completar los puntos que solo pueden resolverse con el cliente presente — verificación de identidad, configuración legal y financiera, y formación básica.

Duración estimada: 60–90 minutos. Al terminar, el cliente debe tener el número de teléfono registrado, Stripe operativo y saber ejecutar las tareas clave de la plataforma.
### 7.1 Twilio — Compra de Numero de Telefono & Registro A2P de marca
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780497931407-ktq61betqoj.mp4)

_Proceso de Compra de Telefono y Registro en Twillio_
> Obligatorio en todas las citas: Sin el registro A2P completado no es posible comprar el número de teléfono ni enviar mensajes SMS. Este paso desbloquea todo el proceso de telefonía.
El registro A2P requiere la identificación en directo del cliente, por eso se hace en la cita:

• El cliente escanea un QR en pantalla y escanea su identificador (driver license o ID).
• Se rellena junto al cliente el formulario de Twilio.
• El cliente es el responsable legal del registro de la marca.

Sugerido completar en este mismo paso: registro de campaña de mensajería, compra y asignación del número, configuración del messaging service y envío de un SMS de prueba.
> Nota: Una vez tenemos el email correctamente configurado lo añadimos en Custom Values. Al campo Company Phone
### 7.1.1 Registro en el resto de Trust Cent Options
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780567383115-4cpj6s9297v.mp4)
**Step 1 — Confirmar que el A2P ya está registrado**
Antes de empezar, asegúrate de que el Business Profile y el A2P ya están registrados. Con esa primera parte hecha, ya se pueden completar las secciones de Shaken/Stir, CNAM y Voice Integrity.

**Step 2 — Registrar Shaken/Stir**
Entra en Trust Center y haz clic en Start Registration. Como el Business Profile ya está completado, el sistema debería llevarte directamente a Shaken/Stir. Añade el nombre del cliente o de la empresa, marca la certificación y haz clic en Submit.

**Step 3 — Registrar CNAM**
Después, configura CNAM. Aquí debes poner el nombre que quieres que aparezca cuando el cliente llame. Ten en cuenta que suele haber límite de caracteres, así que si el nombre de la empresa es muy largo, usa una versión más corta y clara. Marca la certificación y haz clic en Submit.

**Step 4 — Registrar Voice Integrity**
Por último, entra en Voice Integrity. En Select Use, selecciona Customer Support, ya que cubre bien la mayoría de casos. En Employee Count, indica el número de empleados del cliente. En Average Daily Call Volume, pon una estimación razonable, por ejemplo entre 10 y 50 llamadas diarias, según el caso.

**Step 5 — Revisar el estado**
Vuelve al Trust Center y comprueba que las tres secciones aparecen en Review. Normalmente Shaken/Stir, CNAM y Voice Integrity se aprueban en unas horas. El proceso que suele tardar más es el A2P.
### 7.1.2 Asignar las Inbound calls al Cliente
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780567397562-a4prx9stgqj.mp4)
Instrucciones para redirigir llamadas al usuario

**Step 1 — Entrar en Phone Numbers**
Cuando el Trust Center ya esté registrado, ve a Phone Systems → Phone Numbers y selecciona el número comprado para el cliente.

**Step 2 — Editar la configuración del número**
Entra en Edit Configuration y selecciona la opción de Team Member. Añade el usuario principal del cliente. Si el cliente tiene más usuarios en la cuenta, añádelos también.

**Step 3 — Activar las rutas de llamada**
Activa únicamente las opciones de Web App y Mobile App. Estas serán las rutas por las que el sistema enviará las llamadas al usuario.

**Step 4 — Configurar el tiempo de llamada**
Define el tiempo de llamada entrante en 40 segundos. Si nadie responde, la llamada debe ir directamente al voicemail.

**Step 5 — Revisar Advanced Settings**
Antes de guardar, entra en Advanced Settings y revisa que todo esté correcto. En principio, no hace falta tocar nada más.

**Step 6 — Desactivar el desvío al teléfono del negocio**
Después de guardar, ve a Voice → Other Settings y desactiva Forward Calls to Business Phone Number. Así las llamadas entrarán solo por la app/web app, no directamente al teléfono físico del cliente.
### 7.2 Dominios
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780569961898-xqd1u5ei9e.mp4)
Solo aplica si el cliente no autorizó la compra del dominio en el formulario.

En ese caso, durante la cita el cliente aporta las credenciales de su proveedor (GoDaddy, Namecheap u otro) para conectar el dominio a GHL y configurar los registros DNS necesarios.
**Step 1 — Acceder a Domains**
Dentro de la subcuenta del cliente, entra en Settings → Domains y haz clic en Connect Domain.

**Step 2 — Añadir el dominio principal**
Escribe el dominio del cliente sin www, por ejemplo:
`dominio.com`
Selecciona que el dominio se usará para Website/Funnel.

**Step 3 — Conectar los DNS**
La plataforma mostrará los registros DNS necesarios. Accede al proveedor del dominio del cliente —GoDaddy, Namecheap, Cloudflare, etc.— y añade los records indicados.

Normalmente serán registros para:
`@ and www`
Si ya existen registros antiguos para `@` o `www`, revisa si apuntan a una web anterior. Si el cliente quiere reemplazar la web antigua, elimina los registros conflictivos y deja solo los que pide Patron Pro.

**Step 4 — Verificar el dominio**
Vuelve a Patron Pro y haz clic en Verify Records. Si aparece error, espera unos minutos y vuelve a verificar. Los DNS pueden tardar en propagarse.

Revisa este punto en Fase 6.4.1 Compra de Dominio y Configuración para más detalles como configurar el dominio a website y funnels.

**Step 5 — Conectar el dominio de email**
Después, vuelve a Domains → Connect Domain y añade el subdominio de email:

`email.dominio.com`

Este dominio se usará para enviar emails desde la plataforma.

**Step 6 — Configurar el remitente**
Cuando el dominio de email esté verificado, configura:

`From Name: Nombre de la empresa del cliente`
`From Email: info@email.dominio.com`

Revisa este punto en Fase 6.4.2 Autenticación de email para más detalles.

**Step 7 — Confirmación final**
Comprueba que tanto el dominio de Website/Funnel como el dominio de Email aparecen verificados. Cuando ambos estén activos, la conexión del dominio queda completada.
### 7.3 Stripe — Configuración de pagos
> Punto crítico de la cita: La configuración de Stripe es el punto más crítico. Sin ella, el cliente no puede cobrar a sus propios clientes. Verificar antes de la cita que el cliente trae toda la documentación necesaria.
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1779902977612-w7xlqufuwv.mp4)
Pasos a completar durante la cita:

1. Crear la cuenta de Stripe del cliente (si no la tiene).
2. Vincular la cuenta bancaria a Stripe.
3. Definir el payout schedule: con qué frecuencia y en qué días quiere recibir los pagos.

El cliente debe aportar: cuenta bancaria, documentación legal del negocio, SSN y cualquier otro dato financiero requerido.
### 7.4 Miembros y Staff
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780570405493-eflosd72e4.mp4)
**Step 1 — Acceder a My Staff**
Dentro de la subcuenta del cliente, entra en Settings → My Staff.

**Step 2 — Añadir un nuevo miembro**
Haz clic en Add Employee e introduce los datos del miembro del equipo:

• Nombre
• Apellido
• Email

**Step 3 — Configurar el rol del usuario**
En la sección de permisos, hay dos opciones principales:

• Admin
• User

**Por defecto, asignamos siempre el rol User.**
Solo se debe asignar Admin si el cliente lo pide expresamente o si esa persona necesita acceso completo a la configuración de la cuenta.

**Step 4 — Enviar la invitación**
Guarda el usuario y envía la invitación. La persona recibirá un email para acceder a la plataforma.

**Step 5 — Repetir el proceso**
Repite el mismo proceso con cada miembro del equipo que el cliente quiera añadir.
### 7.5 Horarios de los calendarios
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780571220693-70j7n3nrvwq.mp4)
**Step 1 — Entrar en Calendars**
Una vez creado el staff, entra en Calendars y revisa los calendarios que tendrá el cliente, por ejemplo Free Consultation y Onsite Visit.

**Step 2 — Asignar responsables**
En cada calendario, entra en Settings y asigna el usuario que gestionará esas citas.
Si solo debe gestionarlo una persona, añade únicamente al usuario principal. Si deben gestionarlo varios miembros del staff, puedes añadir los que el cliente solicite en "On Site Visit".

**Step 3 — Configurar la distribución de citas**
Si hay varios usuarios asignados al mismo calendario. Por defecto usa Availability si quieres priorizar quién tiene huecos disponibles. En caso de que el cliente lo desee usa Equal Distribution si quiere repartir las citas de forma equilibrada entre los usuarios.

**Step 4 — Configurar disponibilidad**
En Availability, define cuándo se pueden reservar citas. Puedes usar los Work Hours generales del usuario o crear un Custom Schedule específico para ese calendario.

Por ejemplo, si el cliente solo quiere atender consultas ciertos días, se puede limitar el calendario a lunes y martes.

**Step 5 — Evitar reservas para el mismo día**
En las reglas de disponibilidad, configura el mínimo de reserva para el día siguiente. Así evitamos que alguien pueda reservar una cita para el mismo día sin margen.

**Step 6 — Revisar Booking Rules**
En Booking Rules, revisa la duración de la cita y el intervalo entre reservas. Para llamadas de consulta, una configuración habitual sería:

Duración: 15 minutos
Meeting interval: 30 minutos
Reserva mínima: día siguiente

Esto evita solapamientos y deja margen entre llamadas.

**Step 7 — Guardar y activar calendarios**
Guarda los cambios en cada calendario. Cuando la configuración esté revisada, activa los calendarios para que queden operativos dentro del sistema.
### 7.6 Descargar la App
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780571657251-437zz7rg05f.mp4)
**Step 1 — Confirmar si el cliente ya tiene la app**
Pregunta al cliente si ya ha podido descargar la aplicación móvil. Si no la tiene o necesita ayuda, guíale en el proceso.

**Step 2 — Encontrar los links de descarga**
Dentro de la plataforma, ve a Mobile App. Ahí aparecen los links para descargar la app según el dispositivo del cliente.

**Step 3 — Preguntar qué dispositivo usa**
Si el cliente necesita ayuda, pregúntale si usa:

iPhone
Android

Según su respuesta, envíale el link correspondiente.

**Step 4 — Enviar la invitación desde el panel**
Si el cliente tiene dificultades técnicas, puedes enviarle la invitación directamente desde el panel de Patron Pro. Selecciona al usuario correspondiente y envía la invitación.

**Step 5 — Confirmar recepción**
El cliente recibirá un email en la dirección con la que se registró, con el link para descargar la app móvil.
## 8. Fase 4 - Verificación y Acceso
### 8.0 Espera a verificación de Twillio
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780579991878-t37z6y1derh.png)
Escribe aquí el contenido…
### 8.1 Añadir Formulario al Website
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780581603809-6irmznorsvu.mp4)
**Step 1 — Confirmar que Trust Center está aprobado**
Antes de añadir el formulario, revisa que en Phone Systems → Trust Center esté todo aprobado y en verde.

**Step 2 — Copiar el embed del calendario**
Ve a Calendars → Calendar Settings y abre el calendario Free Consultation Call.
Busca el Embed Code. No uses el scheduling link ni el one-time link.

**Step 3 — Pegar el código en Landing Form**
Copia el Embed Code y ve a Settings → Custom Values.
Edita el Custom Value llamado Landing Form, pega el script y guarda los cambios.

**Step 4 — Comprobar la website**
Refresca la página del cliente y verifica que el formulario ya aparece correctamente en la website.

**Step 5 — Finalizar revisión**
Con el formulario integrado, la website debería quedar operativa con los datos, imágenes y formulario del cliente correctamente configurados.
### 8.2 Activación de la cuenta
Si el cliente entra al sistema antes de que hayamos activado la cuenta esta es la vista que va a ver.
![](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780582614469-p86l242m8m.png)
El proceso para activar la cuenta es el siguiente
[Video](https://mtkbqnngqcqywsdewaxs.supabase.co/storage/v1/object/public/docs-media/uploads/1780582644305-9rdl6x8rdh.mp4)
Step 1 — Revisar que todo esté configurado
Antes de activar la cuenta, asegúrate de que el onboarding del cliente está completado y que la configuración principal ya ha sido revisada.

Step 2 — Ir al SA Configurator
Entra en SA Configurator y ve a la sección Security. Ahí aparecerán las cuentas de clientes que todavía están en pausa y pendientes de activar.

Step 3 — Aprobar la cuenta
Busca la cuenta del cliente correspondiente y haz clic en Approve. En ese momento, la cuenta queda activa dentro del sistema.

Step 4 — Revisar si el usuario está verificado
Después de aprobar la cuenta, entra en la subcuenta del cliente y ve a:

Settings → My Staff

Abre el usuario principal del cliente y revisa si aparece la opción de enviar Verification Email.

Step 5 — Enviar email de verificación si hace falta
Si el usuario todavía no está verificado, envía el Verification Email desde su perfil. Este email puede tardar unos minutos en llegar.

Step 6 — Avisar al cliente
Envía un mensaje al cliente por SMS, WhatsApp o email indicando que su cuenta ya está lista. Si el cliente ya se había registrado y no recuerda la contraseña, puede usar la opción de Reset Password desde la app o desde la pantalla de login.
## 9. Checklist maestro de configuración en PatronPro
> Sugerido — Sección complementaria: Esta sección recopila los ajustes habituales de una subcuenta de GHL en forma de checklist. Revisar cada bloque y conservar solo lo que aplica al proceso de PatrnPro.
### 9.1 Subcuenta y perfil de negocio
• Nombre comercial y nombre legal.
• Dirección y zona horaria del negocio.
• Teléfono y email de negocio por defecto.
• Logo de la subcuenta cargado.
• Ajustes generales y de seguridad de la cuenta.
### 9.2 Telefonía y A2P (Fase 3)
• Registro de marca (brand) A2P 10DLC completado.
• Campaña de mensajería registrada.
• Número de teléfono comprado y asignado.
• Messaging service configurado.
• SMS y llamada de prueba enviados y verificados.
### 9.3 Email (Fase 2)
• Dominio de envío de correo configurado en la subcuenta.
• Registros DKIM, SPF y DMARC verificados.
• From-name y from-email por defecto definidos.
### 9.4 Dominios y DNS (Fases 2 y 3)
• Dominio comprado o dominio existente conectado a GHL.
• Registros DNS de web y correo configurados.
• SSL activo y verificado.
• Subdominios para funnels y webs adicionales si aplica.
### 9.5–9.16 Resto del checklist
• 9.5 Calendarios: activación, asignación de staff, horarios definitivos, buffers y notificaciones.
• 9.6 Webs y funnels: HTML cargado, Privacy Policy activa, favicon, SEO básico, comprobación en móvil.
• 9.7 Pagos (Stripe): cuenta, banco, payout schedule, productos, invoices, recibos automáticos.
• 9.8 Contratos y documentos: plantillas creadas, firma electrónica habilitada.
• 9.9 Contactos y datos: vista personalizada, campo de idioma, etiquetas estándar, smart lists.
• 9.10 Pipelines y oportunidades: pipelines y etapas del snapshot verificados.
• 9.11 Automatizaciones: workflows del snapshot activos, recordatorios.
• 9.12 Conversaciones: canales del inbox configurados, snippets y plantillas de respuesta.
• 9.13 Usuarios y permisos: usuarios creados con roles correctos, asignados a calendarios.
• 9.14 Branding y white-label: colores aplicados, app móvil configurada.
## Anexo A — Qué debe traer el cliente a la cita
Este es el checklist que se envía al cliente en el email de preparación. Debe llegar a la cita con todo esto listo.

Para el registro A2P de Twilio:
• Identificador personal (driver license o ID) — se escanea en directo durante la cita.
• Datos del negocio y de la marca.
• EIN, si dispone de él.

Para la configuración de Stripe:
• Cuenta bancaria activa.
• Documentación legal del negocio.
• Social Security Number (SSN).
• Cualquier otro dato financiero requerido por Stripe.

Para el dominio (solo si aplica):
• Credenciales del proveedor de dominio (GoDaddy, Namecheap u otro), si el cliente tiene dominio propio y no autorizó la compra.
## Anexo B — Checklist por cliente
Plantilla de seguimiento para copiar y completar con cada cliente:

Fase 1 — Alta y captura:
  ☐ Pre-registro y pago confirmados
  ☐ Cita de onboarding agendada
  ☐ Formulario de onboarding recibido y revisado

Fase 2 — Configuración previa:
  ☐ Snapshot verificado (pipelines, automatizaciones, calendarios)
  ☐ Vista de contactos y campo de idioma configurados
  ☐ Calendarios activados con staff asignado
  ☐ Web (HTML) cargada y enlaces legales verificados
  ☐ Dominio comprado / pendiente para la cita
  ☐ Branding aplicado (logo y colores)

Fase 3 — Cita:
  ☐ Registro A2P de Twilio completado
  ☐ Stripe configurado y vinculado al banco
  ☐ Idioma de la plataforma configurado
  ☐ Horarios de calendarios afinados con el cliente
  ☐ Mini-formaciones realizadas

Cierre:
  ☐ QA final completado
  ☐ Cuenta activada y credenciales entregadas
  ☐ Email de bienvenida enviado
## Anexo C — Puntos pendientes de definir
> Lista consolidada de acciones pendientes: Cada punto es una tarea concreta que debe resolverse antes de considerar este manual completo:

1. Campos del pop-up de pre-registro (§5.1) — confirmar nombre, email, teléfono y mapeo a GHL.
2. Flujos de recuperación de agendamiento (§5.3) — documentar disparadores, pasos, cadencia y condición de salida.
3. Mecanismo de «pausa» de la cuenta (§5.4) — documentar el procedimiento técnico exacto en GHL.
4. Quinto step del formulario de onboarding (§5.5) — confirmar contenido.
5. Formulario definitivo completo (§5.5 y Anexo A) — adjuntar con todas las preguntas y mapeo a custom values.
6. Portal interno de gestión (§5.7) — documentar acceso, estructura y sistema de seguimiento por cliente.
7. Paso del QR en el registro A2P (§7.1) — documentar herramienta y procedimiento durante la videollamada.
8. Criterios del QA final y responsable de activación (§8.3) — definir quién valida qué y quién ejecuta el traspaso.
9. Mapeo de comunicaciones a workflows de GHL (§10) — nombre del workflow, disparador y plantilla para cada comunicación.

## FAQ'S de Clientes

Slug: faqs-clientes
Published: true
Updated: 2026-06-08T19:46:13.214254+00:00

## FAQ'S Generales
## FAQ's Onboarding
## FAQ's Seminario
