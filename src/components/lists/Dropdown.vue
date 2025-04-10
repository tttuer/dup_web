<script setup>
import {ref} from "vue";

const selected = ref('선택')
const isOpen = ref(false)

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  nameToEnum: {
    type: Object,
    required: true,
  },
  placeholder: {
    type: String,
    default: "선택하세요",
  },
})



const emit = defineEmits(['select'])

const selectOption = (option) => {
  selected.value = option
  isOpen.value = false
  emit('select', props.nameToEnum[option])
}


</script>

<template>
  <div class="flex-none">
    <div class="relative inline-block text-left mb-2 z-50">
      <div>
        <button type="button"
                class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
                @click="isOpen = !isOpen" id="menu-button" aria-expanded="true" aria-haspopup="true">
          {{ selected }}
          <svg class="-mr-1 size-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
               data-slot="icon">
            <path fill-rule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <!--
        Dropdown menu, show/hide based on menu state.

        Entering: "transition ease-out duration-100"
          From: "transform opacity-0 scale-95"
          To: "transform opacity-100 scale-100"
        Leaving: "transition ease-in duration-75"
          From: "transform opacity-100 scale-100"
          To: "transform opacity-0 scale-95"
      -->
      <!-- 드롭다운 메뉴 -->
      <div
          id="dropdown-menu"
          v-show="isOpen"
          class="absolute w-full left-0 z-10 mt-2 min-w-max origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-hidden"
          role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">

        <div class="py-1" role="none">
          <a v-for="(option, index) in options" :key="index" href="#"
             class="block px-4 py-2 text-sm text-gray-700"
             tabindex="-1" role="menuitem"
             @click="selectOption(option)">{{ option }}</a>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>