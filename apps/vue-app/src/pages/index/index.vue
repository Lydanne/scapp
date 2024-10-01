<template>
  <view class="demo">
    <component 
      v-for="(item, index) in data" 
      :key="index" 
      :is="item.component" 
      v-bind="item.props" 
    >
    <template #item="{ data }">
      <view style="color: red;">
        <comp3 :label="data"></comp3>
      </view>
    </template>
   </component>

   <nut-button @tap="onAdd">添加</nut-button>
  </view>
</template>

<script setup>
import { ref } from "vue";
import comp1 from "../../components/comp1/comp1.vue";
import comp2 from "../../components/comp2/comp2.vue";
import comp3 from "../../components/comp3/comp3.vue";

const data = ref([
  { component: comp1, props: { label: "COMP1" } },
  { component: comp2, props: { label: "COMP2" } }
])

function onAdd(e) {
  data.value.push({ component: comp3, props: { label: "COMP1" } })
}

</script>

<style>
.demo {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
